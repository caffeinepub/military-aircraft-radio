import React from 'react';
import { RadioStation } from '../services/radioBrowserApi';
import { PlaybackState, StreamHealth } from '../hooks/useRadioPlayer';
import { AudioVisualizer } from './AudioVisualizer';
import { RefreshCw, WifiOff } from 'lucide-react';

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
  const hasStation = station !== null;

  const statusLabel =
    streamHealth === 'reconnecting' ? 'RECONNECTING' :
    streamHealth === 'failed' ? 'NO SIGNAL' :
    isPlaying ? 'ON AIR' :
    isLoading ? 'TUNING' :
    playbackState === 'paused' ? 'PAUSED' :
    playbackState === 'error' ? 'NO SIGNAL' :
    'STANDBY';

  const statusColor =
    streamHealth === 'reconnecting' ? 'hud-text-amber' :
    streamHealth === 'failed' ? 'text-destructive' :
    isPlaying ? 'hud-text' :
    isLoading ? 'hud-text-amber' :
    playbackState === 'error' ? 'text-destructive' :
    'hud-text-dim';

  return (
    <div className="px-3 py-2">
      <div className="flex items-center gap-3">
        {/* Station info */}
        <div className="flex-1 min-w-0">
          {hasStation ? (
            <>
              <div className="font-doto font-bold text-sm hud-text-bright tracking-wider truncate leading-tight">
                {station.name}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-[9px] tracking-widest font-orbitron ${statusColor}`}>
                  {statusLabel}
                </span>
                {streamHealth === 'reconnecting' && (
                  <RefreshCw size={8} className="hud-text-amber animate-spin" />
                )}
                {streamHealth === 'failed' && (
                  <WifiOff size={8} className="text-destructive" />
                )}
                {station.country && (
                  <span className="hud-text-dim text-[9px]">{station.country}</span>
                )}
                {station.bitrate > 0 && (
                  <span className="hud-text-dim text-[9px] font-doto">{station.bitrate}k</span>
                )}
              </div>
            </>
          ) : (
            <div className="hud-text-dim font-orbitron text-[10px] tracking-widest">
              Select a station
            </div>
          )}
        </div>

        {/* Audio visualizer */}
        <div className="shrink-0">
          <AudioVisualizer
            analyserNode={analyserNode}
            isActive={isPlaying}
            className="opacity-90"
          />
        </div>
      </div>
    </div>
  );
}
