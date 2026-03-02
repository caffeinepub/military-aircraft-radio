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
          <span className="text-xs text-dim">No station selected</span>
        )}
      </div>

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
