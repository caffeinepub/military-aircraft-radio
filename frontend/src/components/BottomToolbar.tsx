import React, { useState } from 'react';
import { Play, Pause, Square, Loader, Sun, Moon, MoreHorizontal, Share2, Info, Volume2, VolumeX } from 'lucide-react';
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
    <div className="shrink-0 border-t border-hud-border px-4 py-2 flex items-center justify-between gap-2">
      {/* Left: Volume */}
      <div className="flex items-center gap-2 flex-1">
        <button
          onClick={() => onVolumeChange(volume > 0 ? 0 : 0.8)}
          className="hud-text-dim hover:hud-text transition-colors p-1 shrink-0"
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

      {/* Center: Play/Pause + Stop */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Stop */}
        <button
          onClick={onStop}
          disabled={!hasStation}
          className="hud-text-dim p-1.5 border border-hud-border hover:border-hud-green/50 hover:hud-text transition-all disabled:opacity-20 disabled:cursor-not-allowed"
          aria-label="Stop"
        >
          <Square size={12} />
        </button>

        {/* Play/Pause — center, larger */}
        {isLoading ? (
          <button
            disabled
            className="hud-text-amber p-2 border border-hud-amber/40 bg-hud-amber/5"
            aria-label="Loading"
          >
            <Loader size={16} className="animate-spin" />
          </button>
        ) : isPlaying ? (
          <button
            onClick={onPause}
            className="hud-text p-2 border border-hud-green bg-hud-green/10 hover:bg-hud-green/20 transition-all"
            aria-label="Pause"
          >
            <Pause size={16} />
          </button>
        ) : (
          <button
            onClick={onResume}
            disabled={!hasStation}
            className="hud-text p-2 border border-hud-border hover:border-hud-green hover:bg-hud-green/10 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
            aria-label="Play"
          >
            <Play size={16} />
          </button>
        )}
      </div>

      {/* Right: Theme toggle + Meatball menu */}
      <div className="flex items-center gap-1 flex-1 justify-end">
        {/* Dark/Light toggle */}
        <button
          onClick={onToggleTheme}
          className="hud-text-dim hover:hud-text transition-colors p-1.5 border border-hud-border hover:border-hud-green/50"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
        </button>

        {/* Meatball menu */}
        <Popover open={meatballOpen} onOpenChange={setMeatballOpen}>
          <PopoverTrigger asChild>
            <button
              className="hud-text-dim hover:hud-text transition-colors p-1.5 border border-hud-border hover:border-hud-green/50"
              aria-label="More options"
            >
              <MoreHorizontal size={13} />
            </button>
          </PopoverTrigger>
          <PopoverContent
            side="top"
            align="end"
            className="w-44 p-1 bg-hud-panel border border-hud-border rounded-none"
          >
            <button
              onClick={handleShare}
              className="w-full flex items-center gap-2 px-3 py-2 text-[11px] hud-text-dim hover:hud-text hover:bg-hud-green/10 transition-colors text-left"
            >
              <Share2 size={11} />
              {copied ? 'Copied!' : 'Share station'}
            </button>
            <div className="border-t border-hud-border my-1" />
            <div className="px-3 py-2 text-[10px] hud-text-dim">
              <div className="flex items-center gap-2 mb-1">
                <Info size={10} />
                <span className="font-orbitron tracking-widest">ABOUT</span>
              </div>
              <p className="opacity-60 leading-relaxed">
                Squadron Radio — tactical internet radio. Powered by Radio Browser API.
              </p>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
