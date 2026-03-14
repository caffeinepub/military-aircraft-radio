import { Radio, RefreshCw, Star, WifiOff } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import type { PlaybackState, StreamHealth } from "../hooks/useRadioPlayer";
import type { RadioStation } from "../services/radioBrowserApi";

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

function useMarquee(deps: unknown[]) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [needsScroll, setNeedsScroll] = useState(false);
  const [marqueeOffset, setMarqueeOffset] = useState("-50%");

  // biome-ignore lint/correctness/useExhaustiveDependencies: deps are dynamic
  useEffect(() => {
    const check = () => {
      const el = textRef.current;
      const container = containerRef.current;
      if (el && container) {
        const overflows = el.scrollWidth > container.clientWidth + 2;
        setNeedsScroll(overflows);
        if (overflows) {
          const offset =
            -((el.scrollWidth - container.clientWidth) / el.scrollWidth) * 100;
          setMarqueeOffset(`${offset.toFixed(1)}%`);
        }
      }
    };
    const t = setTimeout(check, 80);
    return () => clearTimeout(t);
  }, deps);

  return { containerRef, textRef, needsScroll, marqueeOffset };
}

export function NowPlayingPanel({
  station,
  playbackState,
  streamHealth,
  isFavorite = false,
  onAddFavorite,
  onRemoveFavorite,
}: NowPlayingPanelProps) {
  const isPlaying = playbackState === "playing";
  const isLoading = playbackState === "loading";

  // Slogan cycling
  const [sloganIndex, setSloganIndex] = useState(() =>
    Math.floor(Math.random() * SLOGANS.length),
  );
  const [sloganVisible, setSloganVisible] = useState(true);

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

  const nameMarquee = useMarquee([station?.name]);
  const sloganMarquee = useMarquee([sloganIndex]);

  const [imgError, setImgError] = useState(false);
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional reset
  useEffect(() => {
    setImgError(false);
  }, [station?.stationuuid]);

  const statusLabel =
    streamHealth === "reconnecting"
      ? "Reconnecting…"
      : streamHealth === "failed"
        ? "No signal"
        : isPlaying
          ? "Live"
          : isLoading
            ? "Connecting…"
            : playbackState === "paused"
              ? "Paused"
              : playbackState === "error"
                ? "Error"
                : null;

  const statusColor =
    streamHealth === "failed" || playbackState === "error"
      ? "text-destructive"
      : isPlaying
        ? "text-primary"
        : "text-dim";

  return (
    <div className="px-4 flex items-center gap-3" style={{ height: "68px" }}>
      {station ? (
        <>
          {/* Thumbnail */}
          <div className="shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-neutral-hover flex items-center justify-center">
            {station.favicon && !imgError ? (
              <img
                src={station.favicon}
                alt=""
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <Radio size={18} className="text-dim" />
            )}
          </div>

          {/* Text block */}
          <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
            {/* Station name */}
            <div
              ref={nameMarquee.containerRef}
              className="slogan-scroll-container w-full"
            >
              <span
                ref={nameMarquee.textRef}
                className={`text-[14px] font-semibold text-foreground leading-tight slogan-scroll-text${
                  nameMarquee.needsScroll ? " needs-scroll" : ""
                }`}
                style={
                  {
                    "--marquee-offset": nameMarquee.marqueeOffset,
                    animationDuration: "12s",
                  } as React.CSSProperties
                }
              >
                {station.name}
              </span>
            </div>

            {/* Status line */}
            {statusLabel && (
              <div className="flex items-center gap-1">
                {streamHealth === "reconnecting" && (
                  <RefreshCw
                    size={9}
                    className={`${statusColor} animate-spin`}
                  />
                )}
                {streamHealth === "failed" && (
                  <WifiOff size={9} className={statusColor} />
                )}
                {isPlaying && streamHealth === "healthy" && (
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full bg-primary"
                    aria-hidden="true"
                  />
                )}
                <span className={`text-[11px] tracking-wide ${statusColor}`}>
                  {statusLabel}
                </span>
              </div>
            )}
          </div>

          {/* Favorite */}
          <button
            type="button"
            data-ocid="now-playing.toggle"
            aria-label={
              isFavorite ? "Remove from favorites" : "Add to favorites"
            }
            onClick={() => {
              if (isFavorite) {
                onRemoveFavorite?.(station.name);
              } else {
                onAddFavorite?.(station);
              }
            }}
            className="shrink-0 p-2 rounded-lg transition-colors hover:bg-neutral-hover"
          >
            <Star
              size={18}
              className={
                isFavorite ? "fill-foreground text-foreground" : "text-dim"
              }
            />
          </button>
        </>
      ) : (
        /* Idle — slogan centered */
        <div className="flex-1 min-w-0 flex items-center justify-center">
          <div
            ref={sloganMarquee.containerRef}
            className="slogan-scroll-container w-full text-center"
          >
            <span
              ref={sloganMarquee.textRef}
              className={`text-[12px] text-dim italic slogan-scroll-text${
                sloganMarquee.needsScroll ? " needs-scroll" : ""
              }`}
              style={
                {
                  opacity: sloganVisible ? 1 : 0,
                  transition: "opacity 0.4s ease",
                  "--marquee-offset": sloganMarquee.marqueeOffset,
                } as React.CSSProperties
              }
            >
              {SLOGANS[sloganIndex]}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
