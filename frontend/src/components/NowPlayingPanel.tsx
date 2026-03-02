import React, { useEffect, useState } from 'react';
import { RadioStation } from '../services/radioBrowserApi';
import { PlaybackState, StreamHealth } from '../hooks/useRadioPlayer';
import { AudioVisualizer } from './AudioVisualizer';
import { RefreshCw, WifiOff } from 'lucide-react';

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
}

export function NowPlayingPanel({
  station,
  playbackState,
  streamHealth,
  analyserNode,
}: NowPlayingPanelProps) {
  const isPlaying = playbackState === 'playing';
  const isLoading = playbackState === 'loading';

  const [sloganIndex, setSloganIndex] = useState(() =>
    Math.floor(Math.random() * SLOGANS.length)
  );
  const [sloganVisible, setSloganVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setSloganVisible(false);
      setTimeout(() => {
        setSloganIndex((i) => (i + 1) % SLOGANS.length);
        setSloganVisible(true);
      }, 400);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const statusLabel =
    streamHealth === 'reconnecting' ? 'Reconnecting' :
    streamHealth === 'failed' ? 'No signal' :
    isPlaying ? 'Live' :
    isLoading ? 'Connecting' :
    playbackState === 'paused' ? 'Paused' :
    playbackState === 'error' ? 'Error' :
    'Idle';

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
              {streamHealth === 'reconnecting' && (
                <RefreshCw size={10} className="text-dim animate-spin" />
              )}
              {streamHealth === 'failed' && (
                <WifiOff size={10} className="text-destructive" />
              )}
              <span className={`text-[11px] font-medium ${
                isPlaying ? 'text-foreground' :
                streamHealth === 'failed' ? 'text-destructive' :
                'text-dim'
              }`}>
                {statusLabel}
              </span>
              {isPlaying && (
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full bg-foreground animate-blink"
                />
              )}
            </div>
          </>
        ) : (
          <div>
            <span
              className="text-[11px] text-dim italic block truncate"
              style={{
                opacity: sloganVisible ? 1 : 0,
                transition: 'opacity 0.4s ease',
              }}
            >
              {SLOGANS[sloganIndex]}
            </span>
          </div>
        )}
      </div>

      {/* Slogan when station is playing — shown below visualizer area */}
      {station && (
        <div className="hidden sm:block shrink-0 max-w-[160px]">
          <span
            className="text-[10px] text-dim italic truncate block text-right"
            style={{
              opacity: sloganVisible ? 1 : 0,
              transition: 'opacity 0.4s ease',
            }}
          >
            {SLOGANS[sloganIndex]}
          </span>
        </div>
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
