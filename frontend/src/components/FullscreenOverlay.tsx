import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { RadioStation } from '../services/radioBrowserApi';
import { AudioVisualizer } from './AudioVisualizer';
import { useWakeLock } from '../hooks/useWakeLock';
import { PlaybackState, StreamHealth } from '../hooks/useRadioPlayer';
import FullscreenGlobe from './FullscreenGlobe';

interface FullscreenOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  station: RadioStation | null;
  analyserNode: AnalyserNode | null;
  isPlaying: boolean;
  amplitude: number;
  streamHealth: StreamHealth;
  playbackState: PlaybackState;
}

export function FullscreenOverlay({
  isOpen,
  onClose,
  station,
  analyserNode,
  isPlaying,
  streamHealth,
  playbackState,
}: FullscreenOverlayProps) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useWakeLock(isOpen);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      const t = setTimeout(() => setVisible(true), 20);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (!mounted) return null;

  const statusLabel =
    streamHealth === 'reconnecting'
      ? 'Reconnecting'
      : streamHealth === 'failed'
      ? 'No signal'
      : isPlaying
      ? 'Live'
      : playbackState === 'loading'
      ? 'Connecting'
      : playbackState === 'paused'
      ? 'Paused'
      : playbackState === 'error'
      ? 'Error'
      : 'Idle';

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s ease-out',
      }}
    >
      {/* Globe background */}
      {station && <FullscreenGlobe station={station} />}

      {/* Gradient overlay for legibility */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background:
            'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.2) 100%)',
        }}
      />

      {/* Fallback background when no station */}
      {!station && (
        <div className="absolute inset-0" style={{ backgroundColor: 'oklch(0.08 0 0)' }} />
      )}

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-5 right-5 z-20 p-2 rounded text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        aria-label="Exit fullscreen"
        style={{
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.3s ease-out 0.15s',
        }}
      >
        <X size={18} />
      </button>

      {/* Main content */}
      <div
        className="relative z-20 flex flex-col items-center justify-center gap-8 px-8 w-full max-w-sm"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 0.4s ease-out 0.1s, transform 0.4s ease-out 0.1s',
        }}
      >
        {/* App name */}
        <div className="text-xs font-medium tracking-[0.3em] text-white/40 uppercase">
          Antenna
        </div>

        {/* Station name */}
        <div className="text-center">
          {station ? (
            <>
              <div
                className="font-heading text-white leading-tight drop-shadow-lg"
                style={{ fontSize: 'clamp(1.8rem, 7vw, 3.2rem)' }}
              >
                {station.name}
              </div>
              <div className="flex items-center justify-center gap-3 mt-3">
                <span
                  className={`text-xs font-medium ${
                    isPlaying
                      ? 'text-white'
                      : streamHealth === 'failed'
                      ? 'text-red-400'
                      : 'text-white/50'
                  }`}
                >
                  {statusLabel}
                </span>
                {isPlaying && (
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                )}
                {station.country && (
                  <span className="text-xs text-white/40">{station.country}</span>
                )}
              </div>
            </>
          ) : (
            <div className="text-2xl font-heading text-white/40">Antenna</div>
          )}
        </div>

        {/* Audio Visualizer */}
        <div className="w-full">
          <AudioVisualizer
            analyserNode={analyserNode}
            isActive={isPlaying}
            className="w-full opacity-70"
            style={{ width: '100%', height: 56 }}
          />
        </div>

        {/* Station metadata */}
        {station && (
          <div className="flex items-center gap-4 text-[11px] text-white/30">
            {station.bitrate > 0 && <span>{station.bitrate}k</span>}
            {station.codec && <span>{station.codec}</span>}
            {station.tags && (
              <span className="truncate max-w-[200px] opacity-60">
                {station.tags.split(',').slice(0, 3).join(' · ')}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bottom label */}
      <div
        className="absolute bottom-5 left-0 right-0 flex justify-center pointer-events-none z-20"
        style={{
          opacity: visible ? 0.3 : 0,
          transition: 'opacity 0.4s ease-out 0.3s',
        }}
      >
        <span className="text-[10px] tracking-[0.4em] text-white/50 uppercase">antenna</span>
      </div>
    </div>
  );
}
