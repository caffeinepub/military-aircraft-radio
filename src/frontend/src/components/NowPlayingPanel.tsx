import { Radio, RefreshCw, Star, WifiOff } from "lucide-react";
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

/** Hook to check if a text element overflows its container */
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { containerRef, textRef, needsScroll, marqueeOffset };
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

  // Marquee for station name
  const nameMarquee = useMarquee([station?.name]);
  // Marquee for secondary info
  const infoMarquee = useMarquee([
    station?.name,
    station?.tags,
    station?.country,
  ]);
  // Marquee for slogan
  const sloganMarquee = useMarquee([sloganIndex]);

  // Build secondary info string
  const secondaryParts: string[] = [];
  if (station?.country) secondaryParts.push(station.country);
  if (station?.tags) {
    const tagList = station.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 3)
      .join(" · ");
    if (tagList) secondaryParts.push(tagList);
  }
  if (station?.bitrate && station.bitrate > 0)
    secondaryParts.push(`${station.bitrate}kbps`);
  const secondaryInfo = secondaryParts.join(" · ");

  const [imgError, setImgError] = useState(false);
  // Reset img error when station changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional reset
  useEffect(() => {
    setImgError(false);
  }, [station?.stationuuid]);

  const statusLabel =
    streamHealth === "reconnecting"
      ? "Reconnecting"
      : streamHealth === "failed"
        ? "No signal"
        : isPlaying
          ? "LIVE"
          : isLoading
            ? "Connecting"
            : playbackState === "paused"
              ? "Paused"
              : playbackState === "error"
                ? "Error"
                : "";

  return (
    <div className="px-3 py-2.5 flex items-center gap-3 min-h-[56px]">
      {station ? (
        <>
          {/* Station thumbnail with LIVE badge */}
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-lg overflow-hidden bg-neutral-hover flex items-center justify-center">
              {station.favicon && !imgError ? (
                <img
                  src={station.favicon}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                <Radio size={16} className="text-dim" />
              )}
            </div>
            {/* LIVE badge */}
            {isPlaying && (
              <span className="absolute -bottom-1 -right-1 px-1 py-0 rounded text-[8px] font-bold tracking-wider bg-primary text-primary-foreground leading-tight">
                LIVE
              </span>
            )}
          </div>

          {/* Station name + secondary info */}
          <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
            {/* Station name marquee */}
            <div
              ref={nameMarquee.containerRef}
              className="slogan-scroll-container w-full"
            >
              <span
                ref={nameMarquee.textRef}
                className={`text-[13px] font-semibold text-foreground slogan-scroll-text${
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

            {/* Secondary info row: status + scrolling meta */}
            <div className="flex items-center gap-1.5 min-w-0">
              {/* Status indicator */}
              {(isPlaying ||
                isLoading ||
                streamHealth === "failed" ||
                streamHealth === "reconnecting") && (
                <span
                  className={`shrink-0 text-[9px] font-bold tracking-widest uppercase ${
                    isPlaying
                      ? "text-primary"
                      : streamHealth === "failed"
                        ? "text-destructive"
                        : "text-dim"
                  }`}
                >
                  {streamHealth === "reconnecting" ? (
                    <span className="flex items-center gap-0.5">
                      <RefreshCw size={8} className="animate-spin" />
                      {statusLabel}
                    </span>
                  ) : streamHealth === "failed" ? (
                    <span className="flex items-center gap-0.5">
                      <WifiOff size={8} />
                      {statusLabel}
                    </span>
                  ) : (
                    statusLabel
                  )}
                </span>
              )}

              {/* Scrolling secondary info */}
              {secondaryInfo && (
                <div
                  ref={infoMarquee.containerRef}
                  className="slogan-scroll-container flex-1 min-w-0"
                >
                  <span
                    ref={infoMarquee.textRef}
                    className={`text-[10px] text-dim slogan-scroll-text${
                      infoMarquee.needsScroll ? " needs-scroll" : ""
                    }`}
                    style={
                      {
                        "--marquee-offset": infoMarquee.marqueeOffset,
                        animationDuration: "10s",
                      } as React.CSSProperties
                    }
                  >
                    {secondaryInfo}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Favorite toggle */}
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
            className="shrink-0 p-1.5 rounded transition-colors hover:bg-neutral-hover"
          >
            <Star
              size={16}
              className={
                isFavorite ? "fill-foreground text-foreground" : "text-dim"
              }
            />
          </button>

          {/* Visualizer */}
          <div className="shrink-0">
            <AudioVisualizer
              analyserNode={analyserNode}
              isActive={isPlaying}
              className="opacity-80"
              style={{ width: 48, height: 24 }}
            />
          </div>
        </>
      ) : (
        /* Idle state — slogan only */
        <div className="flex-1 min-w-0 flex items-center">
          <div
            ref={sloganMarquee.containerRef}
            className="slogan-scroll-container w-full"
          >
            <span
              ref={sloganMarquee.textRef}
              className={`text-[11px] text-dim italic slogan-scroll-text${
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
