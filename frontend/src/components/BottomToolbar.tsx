import React, { useState } from 'react';
import { Play, Pause, Square, Loader, Sun, Moon, MoreHorizontal, Share2, Info, Volume2, VolumeX, Maximize2, Minimize2 } from 'lucide-react';
import { RadioStation } from '../services/radioBrowserApi';
import { PlaybackState } from '../hooks/useRadioPlayer';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Theme } from '../hooks/useTheme';

interface BottomToolbarProps {
  playbackState: PlaybackState;
  currentStation: RadioStation | null;
  volume: number;
  theme: Theme;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onVolumeChange: (vol: number) => void;
  onToggleTheme: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export function BottomToolbar({
  playbackState,
  currentStation,
  volume,
  theme,
  onPause,
  onResume,
  onStop,
  onVolumeChange,
  onToggleTheme,
  isFullscreen = false,
  onToggleFullscreen,
}: BottomToolbarProps) {
  const [meatballOpen, setMeatballOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const isPlaying = playbackState === 'playing';
  const isLoading = playbackState === 'loading';
  const hasStation = currentStation !== null;

  const handleShare = async () => {
    const url = currentStation
      ? `${window.location.origin}?station=${encodeURIComponent(currentStation.name)}`
      : window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
    setMeatballOpen(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-border bg-background px-4 py-2.5 flex items-center justify-between gap-3">
      {/* Left: Volume */}
      <div className="flex items-center gap-2 flex-1">
        <button
          onClick={() => onVolumeChange(volume > 0 ? 0 : 0.8)}
          className="text-dim hover:text-foreground transition-colors p-1 shrink-0"
          aria-label={volume === 0 ? 'Unmute' : 'Mute'}
        >
          {volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>
        <div className="w-20">
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

      {/* Center: Stop + Play/Pause */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Stop */}
        <button
          onClick={onStop}
          disabled={!hasStation}
          className="text-dim p-1.5 rounded hover:text-foreground hover:bg-neutral-hover transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
          aria-label="Stop"
        >
          <Square size={13} />
        </button>

        {/* Play/Pause */}
        {isLoading ? (
          <button
            disabled
            className="text-dim p-2 rounded"
            aria-label="Loading"
          >
            <Loader size={16} className="animate-spin" />
          </button>
        ) : isPlaying ? (
          <button
            onClick={onPause}
            className="text-foreground p-2 rounded bg-neutral-active hover:bg-neutral-hover transition-colors"
            aria-label="Pause"
          >
            <Pause size={16} />
          </button>
        ) : (
          <button
            onClick={onResume}
            disabled={!hasStation}
            className="text-dim p-2 rounded hover:text-foreground hover:bg-neutral-hover transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
            aria-label="Play"
          >
            <Play size={16} />
          </button>
        )}
      </div>

      {/* Right: Fullscreen + Theme + Menu */}
      <div className="flex items-center gap-1 flex-1 justify-end">
        {/* Fullscreen toggle */}
        {onToggleFullscreen && (
          <button
            onClick={onToggleFullscreen}
            className={`p-1.5 rounded transition-colors ${
              isFullscreen
                ? 'text-foreground bg-neutral-active'
                : 'text-dim hover:text-foreground hover:bg-neutral-hover'
            }`}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        )}

        {/* Dark/Light toggle */}
        <button
          onClick={onToggleTheme}
          className="text-dim hover:text-foreground transition-colors p-1.5 rounded hover:bg-neutral-hover"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
        </button>

        {/* Meatball menu */}
        <Popover open={meatballOpen} onOpenChange={setMeatballOpen}>
          <PopoverTrigger asChild>
            <button
              className="text-dim hover:text-foreground transition-colors p-1.5 rounded hover:bg-neutral-hover"
              aria-label="More options"
            >
              <MoreHorizontal size={13} />
            </button>
          </PopoverTrigger>
          <PopoverContent
            side="top"
            align="end"
            className="w-44 p-1 bg-neutral-panel border border-neutral-border rounded"
          >
            <button
              onClick={handleShare}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-dim hover:text-foreground hover:bg-neutral-hover transition-colors text-left rounded"
            >
              <Share2 size={11} />
              {copied ? 'Copied!' : 'Share station'}
            </button>
            <div className="border-t border-neutral-border my-1" />
            <div className="px-3 py-2 text-[11px] text-dim">
              <div className="flex items-center gap-2 mb-1">
                <Info size={10} />
                <span className="font-medium text-foreground/60 text-[10px] tracking-wide">About</span>
              </div>
              <p className="opacity-60 leading-relaxed text-[10px]">
                Antenna — internet radio. Powered by Radio Browser API.
              </p>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
