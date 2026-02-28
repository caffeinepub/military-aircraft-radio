import React from 'react';
import { RadioStation } from '../services/radioBrowserApi';
import { PlaybackState } from '../hooks/useRadioPlayer';
import { Volume2, VolumeX, Play, Pause, Square, Loader } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface NowPlayingPanelProps {
  station: RadioStation | null;
  playbackState: PlaybackState;
  volume: number;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onVolumeChange: (vol: number) => void;
}

export function NowPlayingPanel({
  station,
  playbackState,
  volume,
  onPause,
  onResume,
  onStop,
  onVolumeChange,
}: NowPlayingPanelProps) {
  const isPlaying = playbackState === 'playing';
  const isLoading = playbackState === 'loading';
  const hasStation = station !== null;

  const statusLabel =
    isPlaying ? 'ON AIR' :
    isLoading ? 'TUNING...' :
    playbackState === 'paused' ? 'PAUSED' :
    playbackState === 'error' ? 'NO SIGNAL' :
    'STANDBY';

  const statusColor =
    isPlaying ? 'hud-text' :
    isLoading ? 'hud-text-amber' :
    playbackState === 'error' ? 'text-destructive' :
    'hud-text-dim';

  return (
    <div className="px-3 py-2 flex items-center gap-3">
      {/* Station info */}
      <div className="flex-1 min-w-0">
        {hasStation ? (
          <>
            <div className="hud-text-bright font-orbitron font-bold text-xs tracking-wide truncate leading-tight">
              {station.name}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-[9px] tracking-widest font-orbitron ${statusColor}`}>
                {statusLabel}
              </span>
              {station.country && (
                <span className="hud-text-dim text-[9px]">{station.country}</span>
              )}
              {station.bitrate > 0 && (
                <span className="hud-text-dim text-[9px]">{station.bitrate}k</span>
              )}
            </div>
          </>
        ) : (
          <div className="hud-text-dim font-orbitron text-[10px] tracking-widest">
            Select a station
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Play/Pause */}
        {isLoading ? (
          <button disabled className="hud-text-amber p-1 border border-hud-amber/30">
            <Loader size={12} className="animate-spin" />
          </button>
        ) : isPlaying ? (
          <button
            onClick={onPause}
            className="hud-text p-1 border border-hud-border hover:border-hud-green transition-all"
          >
            <Pause size={12} />
          </button>
        ) : (
          <button
            onClick={onResume}
            disabled={!hasStation}
            className="hud-text p-1 border border-hud-border hover:border-hud-green transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Play size={12} />
          </button>
        )}

        {/* Stop */}
        <button
          onClick={onStop}
          disabled={!hasStation}
          className="hud-text-dim p-1 border border-hud-border hover:border-hud-green/50 hover:hud-text transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Square size={12} />
        </button>

        {/* Volume */}
        <button
          onClick={() => onVolumeChange(volume > 0 ? 0 : 0.8)}
          className="hud-text-dim hover:hud-text transition-colors p-1"
        >
          {volume === 0 ? <VolumeX size={12} /> : <Volume2 size={12} />}
        </button>
        <div className="w-16">
          <Slider
            value={[volume * 100]}
            onValueChange={([v]) => onVolumeChange(v / 100)}
            min={0}
            max={100}
            step={1}
            className="h-1"
          />
        </div>
      </div>
    </div>
  );
}
