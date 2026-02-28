import React, { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppHeader } from './components/AppHeader';
import { RadarWidget } from './components/RadarWidget';
import { NowPlayingPanel } from './components/NowPlayingPanel';
import { SearchPanel } from './components/SearchPanel';
import { StationList } from './components/StationList';
import { useRadioPlayer } from './hooks/useRadioPlayer';
import { useGetFavorites, useAddFavorite, useRemoveFavorite, toBackendStation } from './hooks/useQueries';
import { fetchTopStations, searchStations, RadioStation } from './services/radioBrowserApi';

type ActiveView = 'stations' | 'favorites';

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('stations');
  const [searchParams, setSearchParams] = useState({ tag: '', country: '', name: '' });
  const [searchOpen, setSearchOpen] = useState(false);

  const player = useRadioPlayer();
  const { data: favorites = [], isLoading: favoritesLoading } = useGetFavorites();
  const addFavoriteMutation = useAddFavorite();
  const removeFavoriteMutation = useRemoveFavorite();

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
        searchOpen={searchOpen}
        onSearchToggle={() => setSearchOpen(v => !v)}
        hasActiveSearch={!!hasSearch}
      />

      {/* Search panel — slides in below header */}
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
          volume={player.volume}
          onPause={player.pause}
          onResume={player.resume}
          onStop={player.stop}
          onVolumeChange={player.setVolume}
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
          emptyMessage={emptyMsg}
          isFavoriteView={activeView === 'favorites'}
        />
      </div>

      {/* Footer */}
      <footer className="shrink-0 border-t border-hud-border px-4 py-1.5 flex items-center justify-between">
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
