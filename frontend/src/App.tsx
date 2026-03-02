import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { fetchTopStations, fetchGlobeStations, searchStations, RadioStation } from './services/radioBrowserApi';

type ActiveView = 'stations' | 'favorites' | 'globe';

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

  const { data: stations = [], isLoading: stationsLoading } = useQuery<RadioStation[]>({
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
  });

  // Dedicated globe stations query — fetches a broad geographic set of 500 stations
  const { data: globeStations = [] } = useQuery<RadioStation[]>({
    queryKey: ['globe-stations'],
    queryFn: fetchGlobeStations,
    staleTime: 10 * 60 * 1000,
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
  const emptyMsg =
    activeView === 'stations'
      ? 'No stations found — try a different search'
      : 'No saved stations yet';

  // Globe shows the dedicated broad-coverage fetch; fall back to search results if a search is active
  const globeDisplayStations = hasSearch ? stations : globeStations;

  return (
    <HUDLayout>
      <div className="flex flex-col h-screen bg-background overflow-hidden max-w-md mx-auto">
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
        {searchOpen && activeView !== 'globe' && (
          <div className="shrink-0 border-b border-border">
            <SearchPanel
              onSearch={handleSearch}
              isLoading={stationsLoading}
              currentParams={searchParams}
            />
          </div>
        )}

        {/* Main content area */}
        {activeView === 'globe' ? (
          <div className="flex-1 overflow-hidden">
            <GlobeView
              stations={globeDisplayStations}
              onStationSelect={handlePlay}
              currentStation={player.currentStation}
            />
          </div>
        ) : (
          <>
            {/* Now Playing */}
            <div className="shrink-0 border-b border-border">
              <NowPlayingPanel
                station={player.currentStation}
                playbackState={player.playbackState}
                streamHealth={player.streamHealth}
                analyserNode={player.analyserNode}
              />
            </div>

            {/* Station list */}
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
                emptyMessage={emptyMsg}
                isFavoriteView={activeView === 'favorites'}
              />
            </div>
          </>
        )}

        {/* Bottom Toolbar */}
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

        {/* Footer */}
        <footer className="shrink-0 border-t border-border px-4 py-2 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            © {new Date().getFullYear()} Antenna
          </span>
          <span className="text-[10px] text-muted-foreground">
            Built with{' '}
            <span className="text-red-400">♥</span>{' '}
            using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
                typeof window !== 'undefined'
                  ? window.location.hostname
                  : 'antenna-radio'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground/60 hover:text-foreground transition-colors underline underline-offset-2"
            >
              caffeine.ai
            </a>
          </span>
        </footer>

        {/* Fullscreen Overlay */}
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
      </div>
    </HUDLayout>
  );
}
