import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AppHeader } from './components/AppHeader';
import { NowPlayingPanel } from './components/NowPlayingPanel';
import { SearchPanel } from './components/SearchPanel';
import { StationList } from './components/StationList';
import { BottomToolbar } from './components/BottomToolbar';
import { FullscreenOverlay } from './components/FullscreenOverlay';
import { HUDLayout } from './components/HUDLayout';
import GlobeView from './components/GlobeView';
import { useRadioPlayer } from './hooks/useRadioPlayer';
import { useTheme } from './hooks/useTheme';
import {
  useGetFavorites,
  useAddFavorite,
  useRemoveFavorite,
  toBackendStation,
} from './hooks/useQueries';
import {
  fetchTopStations,
  fetchGlobeStations,
  searchStations,
  resetApiHostCache,
  RadioStation,
  StationSource,
  StationsResult,
} from './services/radioBrowserApi';

type ActiveView = 'stations' | 'favorites' | 'globe';

// Height of the fixed bottom toolbar — used to add padding so content isn't hidden behind it
const TOOLBAR_HEIGHT = 52;

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('stations');
  const [searchParams, setSearchParams] = useState({ tag: '', country: '', name: '' });
  const [searchOpen, setSearchOpen] = useState(false);
  const [amplitude, setAmplitude] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const player = useRadioPlayer();
  const { theme, toggleTheme } = useTheme();
  const { data: favorites = [], isLoading: favoritesLoading } = useGetFavorites();
  const addFavoriteMutation = useAddFavorite();
  const removeFavoriteMutation = useRemoveFavorite();
  const queryClient = useQueryClient();

  const animFrameRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    analyserRef.current = player.analyserNode;
  }, [player.analyserNode]);

  useEffect(() => {
    function tick() {
      const analyser = analyserRef.current;
      if (analyser && player.playbackState === 'playing') {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i];
        const avg = sum / data.length / 255;
        setAmplitude(avg);
      } else {
        setAmplitude(0);
      }
      animFrameRef.current = requestAnimationFrame(tick);
    }
    animFrameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [player.playbackState]);

  const hasSearch = searchParams.tag || searchParams.country || searchParams.name;

  const {
    data: stationsResult,
    isLoading: stationsLoading,
    isError: stationsError,
    error: stationsErrorObj,
    refetch: refetchStations,
  } = useQuery<StationsResult>({
    queryKey: ['stations', searchParams],
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
  const stationSource: StationSource = stationsResult?.source ?? 'live';

  // Dedicated globe stations query — fetches a broad geographic set of 500 stations
  const {
    data: globeStations = [],
    isError: globeError,
    refetch: refetchGlobe,
  } = useQuery<RadioStation[]>({
    queryKey: ['globe-stations'],
    queryFn: fetchGlobeStations,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });

  const handleSearch = useCallback(
    (params: { tag: string; country: string; name: string }) => {
      setSearchParams(params);
      setSearchOpen(false);
    },
    []
  );

  const handlePlay = useCallback(
    (station: RadioStation) => {
      player.play(station);
    },
    [player]
  );

  const handleAddFavorite = useCallback(
    (station: RadioStation) => {
      addFavoriteMutation.mutate(toBackendStation(station));
    },
    [addFavoriteMutation]
  );

  const handleRemoveFavorite = useCallback(
    (stationName: string) => {
      removeFavoriteMutation.mutate(stationName);
    },
    [removeFavoriteMutation]
  );

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((v) => !v);
  }, []);

  const handleRetryStations = useCallback(() => {
    resetApiHostCache();
    queryClient.removeQueries({ queryKey: ['stations', searchParams] });
    refetchStations();
  }, [queryClient, refetchStations, searchParams]);

  const handleRetryGlobe = useCallback(() => {
    resetApiHostCache();
    queryClient.removeQueries({ queryKey: ['globe-stations'] });
    refetchGlobe();
  }, [queryClient, refetchGlobe]);

  // Convert backend Station[] favorites to RadioStation[] for StationList / GlobeView
  const favoritesAsRadio: RadioStation[] = favorites.map((f) => ({
    stationuuid: f.name,
    name: f.name,
    url: f.url,
    url_resolved: f.url,
    homepage: f.homepage,
    favicon: f.favicon,
    tags: f.tags,
    country: f.country,
    countrycode: '',
    language: f.language,
    codec: f.codec,
    bitrate: Number(f.bitrate),
    votes: 0,
    clickcount: 0,
  }));

  const displayedStations =
    activeView === 'stations' ? stations : favoritesAsRadio;
  const isLoadingList =
    activeView === 'stations' ? stationsLoading : favoritesLoading;
  // Since the service now returns cache/hardcoded instead of throwing, isError
  // will only be true for unexpected React Query errors (network-level failures
  // that bypass our service layer). We still pass it through for safety.
  const isErrorList = activeView === 'stations' ? stationsError : false;
  const errorMessage =
    activeView === 'stations'
      ? (stationsErrorObj as Error)?.message ?? 'Failed to load stations'
      : undefined;
  const emptyMsg =
    activeView === 'stations'
      ? 'No stations found — try a different search'
      : 'No saved stations yet';

  // Only show source banner for the stations view (not favorites)
  const displayedSource: StationSource =
    activeView === 'stations' ? stationSource : 'live';

  // Globe shows the dedicated broad-coverage fetch; fall back to search results if a search is active
  const globeDisplayStations = hasSearch ? stations : globeStations;
  const isGlobeError = !hasSearch && globeError;

  return (
    <HUDLayout>
      {activeView === 'globe' ? (
        /* Globe view: full-viewport layout with header and toolbar overlaid */
        <div className="relative w-full" style={{ height: '100dvh' }}>
          {/* Globe fills the entire viewport */}
          {isGlobeError ? (
            <div className="flex flex-col items-center justify-center w-full h-full gap-3 px-6 text-center bg-background">
              <p className="text-sm text-foreground/70">Couldn't load globe stations</p>
              <p className="text-xs text-muted-foreground">The radio directory may be temporarily unavailable.</p>
              <button
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

          {/* Header overlaid on top of globe */}
          <div className="absolute top-0 left-0 right-0 z-20">
            <AppHeader
              activeView={activeView}
              onViewChange={(v) => setActiveView(v as ActiveView)}
              favoritesCount={favorites.length}
              searchOpen={searchOpen}
              onSearchToggle={() => setSearchOpen((v) => !v)}
              hasActiveSearch={!!hasSearch}
            />
          </div>

          {/* Bottom Toolbar overlaid on top of globe */}
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
            />
          </div>
        </div>
      ) : (
        /* Stations / Favorites view: normal stacked layout */
        <div
          className="flex flex-col bg-background max-w-md mx-auto"
          style={{ minHeight: '100dvh', paddingBottom: TOOLBAR_HEIGHT }}
        >
          {/* Header */}
          <AppHeader
            activeView={activeView}
            onViewChange={(v) => setActiveView(v as ActiveView)}
            favoritesCount={favorites.length}
            searchOpen={searchOpen}
            onSearchToggle={() => setSearchOpen((v) => !v)}
            hasActiveSearch={!!hasSearch}
          />

          {/* Search panel */}
          {searchOpen && (
            <div className="shrink-0 border-b border-border">
              <SearchPanel
                onSearch={handleSearch}
                isLoading={stationsLoading}
                currentParams={searchParams}
              />
            </div>
          )}

          {/* Now Playing */}
          <div className="shrink-0 border-b border-border">
            <NowPlayingPanel
              station={player.currentStation}
              playbackState={player.playbackState}
              streamHealth={player.streamHealth}
              analyserNode={player.analyserNode}
            />
          </div>

          {/* Station list — fills remaining space */}
          <div className="flex-1 overflow-hidden">
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
              isFavoriteView={activeView === 'favorites'}
              stationSource={displayedSource}
            />
          </div>

          {/* Bottom Toolbar — fixed to viewport bottom */}
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
          />
        </div>
      )}

      {/* Fullscreen Overlay — always rendered outside layout containers */}
      <FullscreenOverlay
        isOpen={isFullscreen}
        onClose={() => setIsFullscreen(false)}
        station={player.currentStation}
        analyserNode={player.analyserNode}
        isPlaying={player.playbackState === 'playing'}
        amplitude={amplitude}
        streamHealth={player.streamHealth}
        playbackState={player.playbackState}
      />
    </HUDLayout>
  );
}
