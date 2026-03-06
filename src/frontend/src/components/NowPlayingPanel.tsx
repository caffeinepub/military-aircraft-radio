import { RefreshCw, Star, WifiOff } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import type { PlaybackState, StreamHealth } from "../hooks/useRadioPlayer";
import type { RadioStation } from "../services/radioBrowserApi";
import { AudioVisualizer } from "./AudioVisualizer";

const SLOGANS = [
  "Satellite prices. Basement quality.",
  "Why pay for air?",
  "Subscription fatigue is terrestrial.",
  "We don't charge for oxygen either.",
  "You already pay for the internet. That's enough.",
  "Signal strong. Wallet untouched.",
  "We refuse to invoice the atmosphere.",
  "Airwaves were never meant to be rented.",
  "Stop financing silence.",
  "Music isn't a mortgage.",
  "No monthly tribute required.",
  "You've subscribed to enough things.",
  "Your ears aren't a revenue stream.",
  "The sky is already paid for.",
  "Broadcasting without a billing department.",
  "Cancel the noise tax.",
  "The playlist industrial complex hates this.",
  "No paywalls in orbit.",
  "Free radio for financially literate humans.",
  "Your card can stay in your pocket.",
  "Zero dollars. Maximum frequency.",
  "If it streams, it shouldn't sting.",
  "We came for the signal, not your salary.",
  "No contracts. Just contact.",
  "Earth spins. We broadcast.",
  "The algorithm doesn't own you.",
  "You don't need premium to hear premium.",
  "No tiers. No trials. No traps.",
  "Because radio was born free.",
  "Illegal vibes. Legal stream.",
  "Orbiting outside the subscription economy.",
  "Sound without surveillance.",
  "Free as space.",
];

interface NowPlayingPanelProps {
  station: RadioStation | null;
  playbackState: PlaybackState;
  streamHealth: StreamHealth;
  analyserNode: AnalyserNode | null;
  isFavorite?: boolean;
  onAddFavorite?: (station: RadioStation) => void;
  onRemoveFavorite?: (stationName: string) => void;
}

export function NowPlayingPanel({
  station,
  playbackState,
  streamHealth,
  analyserNode,
  isFavorite = false,
  onAddFavorite,
  onRemoveFavorite,
}: NowPlayingPanelProps) {
  const isPlaying = playbackState === "playing";
  const isLoading = playbackState === "loading";

  const [sloganIndex, setSloganIndex] = useState(() =>
    Math.floor(Math.random() * SLOGANS.length),
  );
  const [sloganVisible, setSloganVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const sideTextRef = useRef<HTMLSpanElement>(null);
  const [needsScroll, setNeedsScroll] = useState(false);
  const [marqueeOffset, setMarqueeOffset] = useState("-50%");

  useEffect(() => {
    const interval = setInterval(() => {
      setSloganVisible(false);
      setTimeout(() => {
        setSloganIndex((i) => (i + 1) % SLOGANS.length);
        setSloganVisible(true);
      }, 400);
    }, 9000);
    return () => clearInterval(interval);
  }, []);

  // Check if slogan overflows its container — sloganIndex is an intentional trigger dep
  // biome-ignore lint/correctness/useExhaustiveDependencies: sloganIndex is used as a trigger to re-run the check after each slogan rotation
  useEffect(() => {
    const checkOverflow = () => {
      const textEl = textRef.current || sideTextRef.current;
      const containerEl = containerRef.current;
      if (textEl && containerEl) {
        const overflow = textEl.scrollWidth > containerEl.clientWidth;
        setNeedsScroll(overflow);
        if (overflow) {
          const offset =
            -(
              (textEl.scrollWidth - containerEl.clientWidth) /
              textEl.scrollWidth
            ) * 100;
          setMarqueeOffset(`${offset.toFixed(1)}%`);
        }
      }
    };
    // Small delay to let DOM settle after slogan change
    const timer = setTimeout(checkOverflow, 50);
    return () => clearTimeout(timer);
  }, [sloganIndex]);

  const statusLabel =
    streamHealth === "reconnecting"
      ? "Reconnecting"
      : streamHealth === "failed"
        ? "No signal"
        : isPlaying
          ? "Live"
          : isLoading
            ? "Connecting"
            : playbackState === "paused"
              ? "Paused"
              : playbackState === "error"
                ? "Error"
                : "Idle";

  return (
    <div className="px-4 py-3 flex items-center gap-3 min-h-[56px]">
      {/* Station info */}
      <div className="flex-1 min-w-0">
        {station ? (
          <>
            <div className="text-sm font-medium text-foreground truncate leading-tight">
              {station.name}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {streamHealth === "reconnecting" && (
                <RefreshCw size={10} className="text-dim animate-spin" />
              )}
              {streamHealth === "failed" && (
                <WifiOff size={10} className="text-destructive" />
              )}
              <span
                className={`text-[11px] font-medium ${
                  isPlaying
                    ? "text-foreground"
                    : streamHealth === "failed"
                      ? "text-destructive"
                      : "text-dim"
                }`}
              >
                {statusLabel}
              </span>
              {isPlaying && (
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-foreground animate-blink" />
              )}
            </div>
          </>
        ) : (
          <div ref={containerRef} className="slogan-scroll-container w-full">
            <span
              ref={textRef}
              className={`text-[11px] text-dim italic slogan-scroll-text${needsScroll ? " needs-scroll" : ""}`}
              style={
                {
                  opacity: sloganVisible ? 1 : 0,
                  transition: "opacity 0.4s ease",
                  "--marquee-offset": marqueeOffset,
                } as React.CSSProperties
              }
            >
              {SLOGANS[sloganIndex]}
            </span>
          </div>
        )}
      </div>

      {/* Slogan when station is playing — shown beside visualizer */}
      {station && (
        <div className="hidden sm:block shrink min-w-0 flex-1 slogan-scroll-container">
          <span
            ref={sideTextRef}
            className={`text-[10px] text-dim italic slogan-scroll-text${needsScroll ? " needs-scroll" : ""}`}
            style={
              {
                opacity: sloganVisible ? 1 : 0,
                transition: "opacity 0.4s ease",
                "--marquee-offset": marqueeOffset,
              } as React.CSSProperties
            }
          >
            {SLOGANS[sloganIndex]}
          </span>
        </div>
      )}

      {/* Favorite toggle — only shown when a station is loaded */}
      {station && (
        <button
          type="button"
          data-ocid="now-playing.toggle"
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          onClick={() => {
            if (isFavorite) {
              onRemoveFavorite?.(station.name);
            } else {
              onAddFavorite?.(station);
            }
          }}
          className="shrink-0 p-1.5 rounded transition-colors hover:bg-neutral-hover"
        >
          <Star
            size={16}
            className={
              isFavorite ? "fill-foreground text-foreground" : "text-dim"
            }
          />
        </button>
      )}

      {/* Visualizer */}
      <div className="shrink-0">
        <AudioVisualizer
          analyserNode={analyserNode}
          isActive={isPlaying}
          className="opacity-80"
          style={{ width: 80, height: 28 }}
        />
      </div>
    </div>
  );
}
