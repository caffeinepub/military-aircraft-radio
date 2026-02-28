import React from 'react';
import { RadioStation } from '../services/radioBrowserApi';
import { Station } from '../backend';
import { Star, Play, Loader, Radio } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface StationListProps {
  stations: RadioStation[] | Station[];
  currentStation: RadioStation | null;
  playbackState: string;
  favorites: Station[];
  onPlay: (station: RadioStation) => void;
  onAddFavorite: (station: RadioStation) => void;
  onRemoveFavorite: (stationName: string) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  isFavoriteView?: boolean;
}

function isRadioStation(s: RadioStation | Station): s is RadioStation {
  return 'stationuuid' in s;
}

function toRadioStation(s: Station): RadioStation {
  return {
    stationuuid: s.name,
    name: s.name,
    url: s.url,
    url_resolved: s.url,
    homepage: s.homepage,
    favicon: s.favicon,
    tags: s.tags,
    country: s.country,
    countrycode: '',
    language: s.language,
    codec: s.codec,
    bitrate: Number(s.bitrate),
    votes: 0,
    clickcount: 0,
  };
}

export function StationList({
  stations,
  currentStation,
  playbackState,
  favorites,
  onPlay,
  onAddFavorite,
  onRemoveFavorite,
  isLoading,
  emptyMessage = 'No stations found',
  isFavoriteView = false,
}: StationListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <Loader size={20} className="hud-text animate-spin" />
        <span className="hud-text-dim text-[10px] tracking-widest">Scanning frequencies...</span>
      </div>
    );
  }

  if (stations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2">
        <Radio size={20} className="hud-text-dim opacity-50" />
        <span className="hud-text-dim text-[10px] tracking-wide">{emptyMessage}</span>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="divide-y divide-hud-border/40">
        {stations.map((s, idx) => {
          const station = isRadioStation(s) ? s : toRadioStation(s);
          const isActive =
            currentStation?.stationuuid === station.stationuuid ||
            currentStation?.name === station.name;
          const isCurrentlyPlaying = isActive && playbackState === 'playing';
          const isCurrentlyLoading = isActive && playbackState === 'loading';
          const isFav = favorites.some(f => f.name === station.name);

          return (
            <div
              key={station.stationuuid || idx}
              className={`group flex items-center gap-2 px-3 py-2 cursor-pointer transition-all ${
                isActive ? 'station-row-active' : 'hover:bg-hud-green/5'
              }`}
              onClick={() => onPlay(station)}
            >
              {/* Play indicator */}
              <div className="w-4 h-4 flex items-center justify-center shrink-0">
                {isCurrentlyLoading ? (
                  <Loader size={10} className="hud-text-amber animate-spin" />
                ) : isCurrentlyPlaying ? (
                  <div className="flex items-end gap-px h-3">
                    {[1, 2, 3].map(i => (
                      <div
                        key={i}
                        className="w-0.5"
                        style={{
                          height: '100%',
                          animation: `signal-bar ${0.5 + i * 0.1}s ease-in-out infinite`,
                          animationDelay: `${i * 0.1}s`,
                          backgroundColor: 'oklch(0.72 0.22 145)',
                          boxShadow: '0 0 3px oklch(0.72 0.22 145)',
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <Play size={10} className="hud-text-dim opacity-0 group-hover:opacity-60 transition-opacity" />
                )}
              </div>

              {/* Favicon */}
              {station.favicon ? (
                <img
                  src={station.favicon}
                  alt=""
                  className="w-4 h-4 object-contain shrink-0 opacity-60"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <Radio size={11} className="hud-text-dim shrink-0 opacity-30" />
              )}

              {/* Station info */}
              <div className="flex-1 min-w-0">
                <div className={`text-[11px] truncate ${isActive ? 'hud-text-bright font-semibold' : 'hud-text'}`}>
                  {station.name}
                </div>
                <div className="flex items-center gap-1.5 text-[9px] hud-text-dim">
                  {station.country && <span>{station.country}</span>}
                  {station.codec && <span className="opacity-60">{station.codec}</span>}
                  {station.bitrate > 0 && <span className="opacity-60">{station.bitrate}k</span>}
                </div>
              </div>

              {/* Favorite toggle */}
              <button
                onClick={e => {
                  e.stopPropagation();
                  if (isFav || isFavoriteView) {
                    onRemoveFavorite(station.name);
                  } else {
                    onAddFavorite(station);
                  }
                }}
                className={`p-1 transition-all shrink-0 ${
                  isFav
                    ? 'hud-text-amber'
                    : 'hud-text-dim opacity-0 group-hover:opacity-60 hover:hud-text-amber'
                }`}
                aria-label={isFav ? 'Remove from saved' : 'Save station'}
              >
                <Star size={11} fill={isFav ? 'currentColor' : 'none'} />
              </button>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
