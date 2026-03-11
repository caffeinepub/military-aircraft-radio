import { Slider } from "@/components/ui/slider";
import {
  Loader,
  Maximize2,
  Minimize2,
  Moon,
  Pause,
  Play,
  Sun,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { PlaybackState } from "../hooks/useRadioPlayer";
import type { Theme } from "../hooks/useTheme";
import type { RadioStation } from "../services/radioBrowserApi";
import { MiniGlobe } from "./MiniGlobe";

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
  amplitude?: number;
}

export function BottomToolbar({
  playbackState,
  currentStation,
  volume,
  theme,
  onPause,
  onResume,
  onStop: _onStop,
  onVolumeChange,
  onToggleTheme,
  isFullscreen = false,
  onToggleFullscreen,
  amplitude = 0,
}: BottomToolbarProps) {
  const isPlaying = playbackState === "playing";
  const isLoading = playbackState === "loading";
  const hasStation = currentStation !== null;

  const handlePlayPause = () => {
    if (isPlaying) {
      onPause();
    } else if (hasStation) {
      onResume();
    }
  };

  return (
    <div
      data-ocid="toolbar.panel"
      className="border-t border-neutral-border bg-background px-5 py-3 flex items-center justify-between gap-4 z-40"
    >
      {/* Left: Volume */}
      <div className="flex items-center gap-3 flex-1">
        <button
          type="button"
          data-ocid="toolbar.toggle"
          onClick={() => onVolumeChange(volume > 0 ? 0 : 0.8)}
          className="text-dim hover:text-foreground transition-colors p-1.5 shrink-0"
          aria-label={volume === 0 ? "Unmute" : "Mute"}
        >
          {volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
        <div className="w-24">
          <Slider
            value={[volume * 100]}
            onValueChange={([v]) => onVolumeChange(v / 100)}
            min={0}
            max={100}
            step={1}
            className="h-1.5"
          />
        </div>
      </div>

      {/* Center: Spectacular Play/Pause Globe Button */}
      <div className="flex items-center shrink-0">
        {isLoading ? (
          <div
            className="flex items-center justify-center rounded-full bg-neutral-active"
            style={{ width: 64, height: 64 }}
            aria-label="Loading"
          >
            <Loader size={24} className="animate-spin text-foreground" />
          </div>
        ) : (
          <button
            type="button"
            data-ocid="toolbar.primary_button"
            onClick={handlePlayPause}
            disabled={!hasStation && !isPlaying}
            aria-label={isPlaying ? "Pause" : "Play"}
            className="relative flex items-center justify-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-foreground/30 disabled:opacity-30 disabled:cursor-not-allowed group"
            style={{
              width: 64,
              height: 64,
              background: isPlaying
                ? "transparent"
                : "oklch(var(--foreground) / 0.08)",
              border: isPlaying
                ? "2px solid rgba(100, 160, 255, 0.55)"
                : "2px solid oklch(var(--foreground) / 0.18)",
            }}
          >
            {isPlaying ? (
              <>
                {/* 3D globe fills the button */}
                <div className="absolute inset-0 rounded-full overflow-hidden">
                  <MiniGlobe size={60} amplitude={amplitude} />
                </div>
                {/* Pause overlay — fades in on hover */}
                <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-all duration-200">
                  <Pause
                    size={22}
                    className="text-white opacity-0 group-hover:opacity-100 drop-shadow-lg transition-opacity duration-200"
                  />
                </div>
              </>
            ) : (
              <Play size={26} className="text-foreground translate-x-0.5" />
            )}
          </button>
        )}
      </div>

      {/* Right: Fullscreen + Theme */}
      <div className="flex items-center gap-3 flex-1 justify-end">
        {/* Fullscreen toggle */}
        {onToggleFullscreen && (
          <button
            type="button"
            data-ocid="toolbar.toggle"
            onClick={onToggleFullscreen}
            className={`p-2 rounded-lg transition-colors ${
              isFullscreen
                ? "text-foreground bg-neutral-active"
                : "text-dim hover:text-foreground hover:bg-neutral-hover"
            }`}
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
        )}

        {/* Dark/Light toggle */}
        <button
          type="button"
          data-ocid="toolbar.toggle"
          onClick={onToggleTheme}
          className="text-dim hover:text-foreground transition-colors p-2 rounded-lg hover:bg-neutral-hover"
          aria-label={
            theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
          }
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </div>
  );
}
