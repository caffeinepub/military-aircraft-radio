import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppHeader } from './components/AppHeader';
import { NowPlayingPanel } from './components/NowPlayingPanel';
import { SearchPanel } from './components/SearchPanel';
import { StationList } from './components/StationList';
import { BottomToolbar } from './components/BottomToolbar';
import { useRadioPlayer } from './hooks/useRadioPlayer';
import { useTheme } from './hooks/useTheme';
import { useGetFavorites, useAddFavorite, useRemoveFavorite, toBackendStation } from './hooks/useQueries';
import { fetchTopStations, searchStations, RadioStation } from './services/radioBrowserApi';

type ActiveView = 'stations' | 'favorites';

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('stations');
  const [searchParams, setSearchParams] = useState({ tag: '', country: '', name: '' });
  const [searchOpen, setSearchOpen] = useState(false);
  const [amplitude, setAmplitude] = useState(0);

  const player = useRadioPlayer();
  const { theme, toggleTheme } = useTheme();
  const { data: favorites = [], isLoading: favoritesLoading } = useGetFavorites();
  const addFavoriteMutation = useAddFavorite();
  const removeFavoriteMutation = useRemoveFavorite();

  const animFrameRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Keep analyser ref in sync
  useEffect(() => {
    analyserRef.current = player.analyserNode;
  }, [player.analyserNode]);

  // Continuously read amplitude from analyser for radar reactivity
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

  const handleSearch = useCallback((params: { tag: string; country: string; name: string }) => {
    setSearchParams(params);
    setSearchOpen(false);
  }, []);

  const handlePlay = useCallback((station: RadioStation) => {
    player.play(station);
  }, [player]);

  const handleAddFavorite = useCallback((station: RadioStation) => {
    addFavoriteMutation.mutate(toBackendStation(station));
  }, [addFavoriteMutation]);

  const handleRemoveFavorite = useCallback((stationName: string) => {
    removeFavoriteMutation.mutate(stationName);
  }, [removeFavoriteMutation]);

  const displayedStations = activeView === 'stations' ? stations : favorites;
  const isLoadingList = activeView === 'stations' ? stationsLoading : favoritesLoading;
  const emptyMsg = activeView === 'stations'
    ? 'No stations found — try a different search'
    : 'No saved stations yet';

  return (
    <div className="flex flex-col h-screen bg-hud-bg overflow-hidden max-w-md mx-auto">
      {/* Header */}
      <AppHeader
        activeView={activeView}
        onViewChange={setActiveView}
        favoritesCount={favorites.length}
        playbackState={player.playbackState}
        amplitude={amplitude}
        searchOpen={searchOpen}
        onSearchToggle={() => setSearchOpen(v => !v)}
        hasActiveSearch={!!hasSearch}
      />

      {/* Search panel */}
      {searchOpen && (
        <div className="shrink-0 border-b border-hud-border">
          <SearchPanel
            onSearch={handleSearch}
            isLoading={stationsLoading}
            currentParams={searchParams}
          />
        </div>
      )}

      {/* Now Playing */}
      <div className="shrink-0 border-b border-hud-border">
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
      />

      {/* Footer */}
      <footer className="shrink-0 border-t border-hud-border px-4 py-1 flex items-center justify-between">
        <span className="hud-text-dim text-[9px] tracking-widest">
          © {new Date().getFullYear()} SQUADRON RADIO
        </span>
        <span className="hud-text-dim text-[9px]">
          Built with{' '}
          <span className="hud-text-amber">♥</span>{' '}
          using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== 'undefined' ? window.location.hostname : 'squadron-radio')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hud-text hover:hud-text-bright transition-colors underline underline-offset-2"
          >
            caffeine.ai
          </a>
        </span>
      </footer>
    </div>
  );
}
