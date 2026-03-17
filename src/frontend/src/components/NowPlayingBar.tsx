import { Radio, RefreshCw, Star, WifiOff } from "lucide-react";
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

/** Bulletproof single-line scrolling ticker using JS animation via requestAnimationFrame */
function ScrollTicker({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const posRef = useRef(0);
  const rafRef = useRef<number>(0);
  const speedPx = 40; // pixels per second

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional restart on text prop change
  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    // Reset position when text changes
    posRef.current = 0;
    inner.style.transform = "translateX(0px)";

    let lastTime: number | null = null;

    function animate(time: number) {
      if (!outer || !inner) return;
      if (lastTime === null) lastTime = time;
      const delta = (time - lastTime) / 1000; // seconds
      lastTime = time;

      const outerWidth = outer.clientWidth;
      // inner contains two copies of text separated by a gap; total width = half of scrollWidth
      const halfWidth = inner.scrollWidth / 2;

      if (halfWidth > outerWidth) {
        // Text overflows — scroll
        posRef.current -= speedPx * delta;
        if (posRef.current <= -halfWidth) {
          posRef.current += halfWidth;
        }
      } else {
        // Text fits — no scroll needed
        posRef.current = 0;
      }

      inner.style.transform = `translateX(${posRef.current}px)`;
      rafRef.current = requestAnimationFrame(animate);
    }

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
    // biome-ignore lint/correctness/useExhaustiveDependencies: intentional restart on text prop change
  }, [text]);

  const sep = "\u00A0\u00A0\u00A0\u2014\u00A0\u00A0\u00A0";
  const copy = text + sep;

  return (
    <div
      ref={outerRef}
      style={{
        width: "100%",
        overflow: "hidden",
        whiteSpace: "nowrap",
        height: "1.3em",
        lineHeight: "1.3em",
      }}
    >
      <div
        ref={innerRef}
        style={{
          display: "inline-block",
          whiteSpace: "nowrap",
          fontFamily: "'Space Mono', monospace",
          willChange: "transform",
        }}
        className={className}
      >
        {copy}
        {copy}
      </div>
    </div>
  );
}

interface NowPlayingBarProps {
  station: RadioStation | null;
  playbackState: PlaybackState;
  streamHealth: StreamHealth;
  analyserNode: AnalyserNode | null;
  isFavorite?: boolean;
  onAddFavorite?: (station: RadioStation) => void;
  onRemoveFavorite?: (stationName: string) => void;
}

export function NowPlayingBar({
  station,
  playbackState,
  streamHealth,
  isFavorite = false,
  onAddFavorite,
  onRemoveFavorite,
}: NowPlayingBarProps) {
  const isPlaying = playbackState === "playing";
  const isLoading = playbackState === "loading";

  const [sloganIndex, setSloganIndex] = useState(() =>
    Math.floor(Math.random() * SLOGANS.length),
  );
  useEffect(() => {
    const id = setInterval(
      () => setSloganIndex((i) => (i + 1) % SLOGANS.length),
      9000,
    );
    return () => clearInterval(id);
  }, []);

  const [imgError, setImgError] = useState(false);
  const prevUuid = useRef<string | null>(null);
  useEffect(() => {
    if (station?.stationuuid !== prevUuid.current) {
      prevUuid.current = station?.stationuuid ?? null;
      setImgError(false);
    }
  }, [station?.stationuuid]);

  const statusLabel =
    streamHealth === "reconnecting"
      ? "Reconnecting\u2026"
      : streamHealth === "failed"
        ? "No signal"
        : isPlaying
          ? "Live"
          : isLoading
            ? "Connecting\u2026"
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
        : "text-muted-foreground";

  if (!station) {
    // Idle — show cycling slogan ticker
    return (
      <div
        className="px-4 flex items-center"
        style={{ height: "56px" }}
        data-ocid="now-playing.panel"
      >
        <ScrollTicker
          text={SLOGANS[sloganIndex]}
          className="text-[12px] text-muted-foreground italic"
        />
      </div>
    );
  }

  return (
    <div
      className="px-4 flex items-center gap-3"
      style={{ height: "56px" }}
      data-ocid="now-playing.panel"
    >
      {/* Thumbnail */}
      <div className="shrink-0 w-9 h-9 rounded-md overflow-hidden bg-muted flex items-center justify-center">
        {station.favicon && !imgError ? (
          <img
            src={station.favicon}
            alt=""
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <Radio size={16} className="text-muted-foreground" />
        )}
      </div>

      {/* Ticker + status */}
      <div
        className="flex-1 min-w-0 flex flex-col justify-center"
        style={{ gap: "2px" }}
      >
        {/* Station name ticker — key forces full remount on station change */}
        <ScrollTicker
          key={station.stationuuid}
          text={station.name}
          className="text-[13px] font-semibold text-foreground"
        />

        {statusLabel && (
          <div className="flex items-center gap-1" style={{ lineHeight: 1 }}>
            {streamHealth === "reconnecting" && (
              <RefreshCw size={9} className={`${statusColor} animate-spin`} />
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
            <span className={`text-[10px] tracking-wide ${statusColor}`}>
              {statusLabel}
            </span>
          </div>
        )}
      </div>

      {/* Favorite button */}
      <button
        type="button"
        data-ocid="now-playing.toggle"
        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        onClick={() =>
          isFavorite
            ? onRemoveFavorite?.(station.name)
            : onAddFavorite?.(station)
        }
        className="shrink-0 p-2 rounded-lg transition-colors hover:bg-muted"
      >
        <Star
          size={18}
          className={
            isFavorite
              ? "fill-foreground text-foreground"
              : "text-muted-foreground"
          }
        />
      </button>
    </div>
  );
}
