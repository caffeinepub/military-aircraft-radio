import React from 'react';
import { Search, X } from 'lucide-react';
import { RadarWidget } from './RadarWidget';
import { PlaybackState } from '../hooks/useRadioPlayer';

interface AppHeaderProps {
  activeView: 'stations' | 'favorites';
  onViewChange: (view: 'stations' | 'favorites') => void;
  favoritesCount: number;
  playbackState: PlaybackState;
  searchOpen: boolean;
  onSearchToggle: () => void;
  hasActiveSearch: boolean;
}

export function AppHeader({
  activeView,
  onViewChange,
  favoritesCount,
  playbackState,
  searchOpen,
  onSearchToggle,
  hasActiveSearch,
}: AppHeaderProps) {
  return (
    <header className="shrink-0 border-b border-hud-border px-3 py-2">
      <div className="flex items-center gap-2">
        {/* Logo + Title */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <img
            src="/assets/generated/fighter-jet-logo.dim_256x256.png"
            alt="Squadron Radio"
            className="w-7 h-7 object-contain shrink-0"
            style={{ filter: 'drop-shadow(0 0 4px oklch(0.72 0.22 145 / 0.6)) brightness(1.1)' }}
          />
          <h1 className="font-orbitron font-black text-sm hud-text-bright tracking-widest leading-none truncate">
            SQUADRON RADIO
          </h1>
        </div>

        {/* Radar — compact state indicator */}
        <RadarWidget size={36} playbackState={playbackState} />

        {/* Search toggle */}
        <button
          onClick={onSearchToggle}
          className={`p-1.5 border transition-all ${
            searchOpen || hasActiveSearch
              ? 'border-hud-green hud-text bg-hud-green/10'
              : 'border-hud-border hud-text-dim hover:border-hud-green/50 hover:hud-text'
          }`}
          aria-label="Toggle search"
        >
          {searchOpen ? <X size={14} /> : <Search size={14} />}
        </button>
      </div>

      {/* View tabs */}
      <div className="flex gap-1 mt-2">
        <button
          onClick={() => onViewChange('stations')}
          className={`flex-1 py-1 font-orbitron text-[10px] tracking-widest border transition-all ${
            activeView === 'stations'
              ? 'hud-text border-hud-green bg-hud-green/10'
              : 'hud-text-dim border-hud-border hover:border-hud-green/40'
          }`}
        >
          STATIONS
        </button>
        <button
          onClick={() => onViewChange('favorites')}
          className={`flex-1 py-1 font-orbitron text-[10px] tracking-widest border transition-all relative ${
            activeView === 'favorites'
              ? 'hud-text border-hud-green bg-hud-green/10'
              : 'hud-text-dim border-hud-border hover:border-hud-green/40'
          }`}
        >
          SAVED
          {favoritesCount > 0 && (
            <span className="ml-1 hud-text-amber text-[9px]">{favoritesCount}</span>
          )}
        </button>
      </div>
    </header>
  );
}
