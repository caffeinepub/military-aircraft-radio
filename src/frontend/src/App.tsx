import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppHeader } from "./components/AppHeader";
import { BottomToolbar } from "./components/BottomToolbar";
import { FullscreenOverlay } from "./components/FullscreenOverlay";
import GlobeView from "./components/GlobeView";
import { HUDLayout } from "./components/HUDLayout";
import { NowPlayingBar } from "./components/NowPlayingBar";
import { SearchPanel } from "./components/SearchPanel";
import { StationList } from "./components/StationList";
import {
  toBackendStation,
  useAddFavorite,
  useGetFavorites,
  useRemoveFavorite,
} from "./hooks/useQueries";
import { useRadioPlayer } from "./hooks/useRadioPlayer";
import { useTheme } from "./hooks/useTheme";
import {
  type RadioStation,
  type StationSource,
  type StationsResult,
  fetchGlobeStations,
  fetchTopStations,
  resetApiHostCache,
  searchStations,
} from "./services/radioBrowserApi";

type ActiveView = "stations" | "favorites" | "globe";

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>("stations");
  const [searchParams, setSearchParams] = useState({
    tag: "",
    country: "",
    name: "",
  });
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchSession, setSearchSession] = useState(0);
  const [amplitude, setAmplitude] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const player = useRadioPlayer();
  const { theme, toggleTheme } = useTheme();
  const { data: favorites = [], isLoading: favoritesLoading } =
    useGetFavorites();
  const addFavoriteMutation = useAddFavorite();
  const removeFavoriteMutation = useRemoveFavorite();
  const queryClient = useQueryClient();

  const animFrameRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  // Throttle amplitude to ~10fps to prevent 60fps re-renders that break scroll
  const lastAmpTimeRef = useRef<number>(0);
  const lastAmpValueRef = useRef<number>(0);

  useEffect(() => {
    analyserRef.current = player.analyserNode;
  }, [player.analyserNode]);

  useEffect(() => {
    function tick(time: number) {
      const analyser = analyserRef.current;
      let newAmp = 0;
      if (analyser && player.playbackState === "playing") {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i];
        newAmp = sum / data.length / 255;
      }
      // Only update state at ~10fps and only when value changes meaningfully
      if (
        time - lastAmpTimeRef.current >= 100 &&
        Math.abs(newAmp - lastAmpValueRef.current) > 0.01
      ) {
        lastAmpTimeRef.current = time;
        lastAmpValueRef.current = newAmp;
        setAmplitude(newAmp);
      }
      animFrameRef.current = requestAnimationFrame(tick);
    }
    animFrameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [player.playbackState]);

  const hasSearch =
    searchParams.tag || searchParams.country || searchParams.name;

  const {
    data: stationsResult,
    isLoading: stationsLoading,
    isError: stationsError,
    error: stationsErrorObj,
    refetch: refetchStations,
  } = useQuery<StationsResult>({
    queryKey: ["stations", searchParams],
    queryFn: async () => {
      if (hasSearch) {
        return searchStations({
          tag: searchParams.tag,
          country: searchParams.country,
          name: searchParams.name,
        });
      }
      return fetchTopStations(80);
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const stations: RadioStation[] = stationsResult?.stations ?? [];
  const stationSource: StationSource = stationsResult?.source ?? "live";

  const {
    data: globeStations = [],
    isError: globeError,
    refetch: refetchGlobe,
  } = useQuery<RadioStation[]>({
    queryKey: ["globe-stations"],
    queryFn: fetchGlobeStations,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });

  const handleSearch = useCallback(
    (params: { tag: string; country: string; name: string }) => {
      setSearchParams(params);
      setSearchOpen(false);
    },
    [],
  );

  const handlePlay = useCallback(
    (station: RadioStation) => {
      player.play(station);
    },
    [player],
  );

  const handleAddFavorite = useCallback(
    (station: RadioStation) => {
      addFavoriteMutation.mutate(toBackendStation(station));
    },
    [addFavoriteMutation],
  );

  const handleRemoveFavorite = useCallback(
    (stationName: string) => {
      removeFavoriteMutation.mutate(stationName);
    },
    [removeFavoriteMutation],
  );

  const toggleFullscreen = useCallback(async () => {
    const isBrowserFullscreen = !!(
      document.fullscreenElement || (document as any).webkitFullscreenElement
    );
    if (!isBrowserFullscreen) {
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        } else if ((document.documentElement as any).webkitRequestFullscreen) {
          await (document.documentElement as any).webkitRequestFullscreen();
        } else {
          setIsFullscreen(true);
        }
      } catch {
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isBrowserFullscreen = !!(
        document.fullscreenElement || (document as any).webkitFullscreenElement
      );
      setIsFullscreen(isBrowserFullscreen);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange,
      );
    };
  }, []);

  const handleRetryStations = useCallback(() => {
    resetApiHostCache();
    queryClient.removeQueries({ queryKey: ["stations", searchParams] });
    refetchStations();
  }, [queryClient, refetchStations, searchParams]);

  const handleRetryGlobe = useCallback(() => {
    resetApiHostCache();
    queryClient.removeQueries({ queryKey: ["globe-stations"] });
    refetchGlobe();
  }, [queryClient, refetchGlobe]);

  const favoritesAsRadio: RadioStation[] = favorites.map((f) => ({
    stationuuid: f.name,
    name: f.name,
    url: f.url,
    url_resolved: f.url,
    homepage: f.homepage,
    favicon: f.favicon,
    tags: f.tags,
    country: f.country,
    countrycode: "",
    language: f.language,
    codec: f.codec,
    bitrate: Number(f.bitrate),
    votes: 0,
    clickcount: 0,
  }));

  const displayedStations =
    activeView === "stations" ? stations : favoritesAsRadio;
  const isLoadingList =
    activeView === "stations" ? stationsLoading : favoritesLoading;
  const isErrorList = activeView === "stations" ? stationsError : false;
  const errorMessage =
    activeView === "stations"
      ? ((stationsErrorObj as Error)?.message ?? "Failed to load stations")
      : undefined;
  const emptyMsg =
    activeView === "stations"
      ? "No stations found — try a different search"
      : "No saved stations yet";
  const displayedSource: StationSource =
    activeView === "stations" ? stationSource : "live";
  const globeDisplayStations = hasSearch ? stations : globeStations;
  const isGlobeError = !hasSearch && globeError;

  return (
    <HUDLayout>
      {activeView === "globe" ? (
        <div className="relative flex-1 min-h-0 w-full overflow-hidden">
          {isGlobeError ? (
            <div className="flex flex-col items-center justify-center w-full h-full gap-3 px-6 text-center bg-background">
              <p className="text-sm text-foreground/70">
                Couldn't load globe stations
              </p>
              <p className="text-xs text-muted-foreground">
                The radio directory may be temporarily unavailable.
              </p>
              <button
                type="button"
                onClick={handleRetryGlobe}
                className="mt-1 text-xs px-4 py-1.5 rounded border border-border hover:bg-neutral-hover transition-colors"
              >
                Retry
              </button>
            </div>
          ) : (
            <GlobeView
              stations={globeDisplayStations}
              onStationSelect={handlePlay}
              currentStation={player.currentStation}
            />
          )}
          <div className="absolute top-0 left-0 right-0 z-20">
            <AppHeader
              activeView={activeView}
              onViewChange={(v) => setActiveView(v as ActiveView)}
              favoritesCount={favorites.length}
              searchOpen={searchOpen}
              onSearchToggle={() => {
                setSearchOpen((v) => !v);
                setSearchSession((s) => s + 1);
              }}
              hasActiveSearch={!!hasSearch}
            />
          </div>
          <div className="absolute bottom-0 left-0 right-0 z-20">
            <BottomToolbar
              playbackState={player.playbackState}
              currentStation={player.currentStation}
              volume={player.volume}
              theme={theme}
              onPause={player.pause}
              onResume={player.resume}
              onStop={player.stop}
              onVolumeChange={player.setVolume}
              onToggleTheme={toggleTheme}
              isFullscreen={isFullscreen}
              onToggleFullscreen={toggleFullscreen}
              amplitude={amplitude}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col bg-background max-w-md mx-auto w-full">
          <AppHeader
            activeView={activeView}
            onViewChange={(v) => setActiveView(v as ActiveView)}
            favoritesCount={favorites.length}
            searchOpen={searchOpen}
            onSearchToggle={() => {
              setSearchOpen((v) => !v);
              setSearchSession((s) => s + 1);
            }}
            hasActiveSearch={!!hasSearch}
          />

          {searchOpen && (
            <div
              className="shrink-0 border-b border-border overflow-y-auto"
              style={{ maxHeight: "35dvh" }}
            >
              <SearchPanel
                key={searchSession}
                onSearch={handleSearch}
                isLoading={stationsLoading}
                currentParams={searchParams}
              />
            </div>
          )}

          <div className="shrink-0">
            <NowPlayingBar
              station={player.currentStation}
              playbackState={player.playbackState}
              streamHealth={player.streamHealth}
              analyserNode={player.analyserNode}
              isFavorite={
                !!player.currentStation &&
                favorites.some((f) => f.name === player.currentStation!.name)
              }
              onAddFavorite={handleAddFavorite}
              onRemoveFavorite={handleRemoveFavorite}
            />
          </div>

          {/* Station list — flex-1 min-h-0 with overflow-y-auto directly: the scrollable region */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
            <StationList
              stations={displayedStations}
              currentStation={player.currentStation}
              playbackState={player.playbackState}
              favorites={favorites}
              onPlay={handlePlay}
              onAddFavorite={handleAddFavorite}
              onRemoveFavorite={handleRemoveFavorite}
              isLoading={isLoadingList}
              isError={isErrorList}
              errorMessage={errorMessage}
              onRetry={handleRetryStations}
              emptyMessage={emptyMsg}
              isFavoriteView={activeView === "favorites"}
              stationSource={displayedSource}
            />
          </div>

          <div className="shrink-0">
            <BottomToolbar
              playbackState={player.playbackState}
              currentStation={player.currentStation}
              volume={player.volume}
              theme={theme}
              onPause={player.pause}
              onResume={player.resume}
              onStop={player.stop}
              onVolumeChange={player.setVolume}
              onToggleTheme={toggleTheme}
              isFullscreen={isFullscreen}
              onToggleFullscreen={toggleFullscreen}
              amplitude={amplitude}
            />
          </div>
        </div>
      )}

      <FullscreenOverlay
        isOpen={isFullscreen}
        onClose={() => setIsFullscreen(false)}
        station={player.currentStation}
        analyserNode={player.analyserNode}
        isPlaying={player.playbackState === "playing"}
        amplitude={amplitude}
        streamHealth={player.streamHealth}
        playbackState={player.playbackState}
      />
    </HUDLayout>
  );
}
