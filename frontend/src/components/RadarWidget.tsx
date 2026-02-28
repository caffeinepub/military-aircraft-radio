import React, { useRef, useEffect } from 'react';
import { PlaybackState } from '../hooks/useRadioPlayer';

interface RadarWidgetProps {
  size?: number;
  className?: string;
  playbackState?: PlaybackState;
  // Legacy prop kept for compatibility
  isActive?: boolean;
}

// Sweep speed in radians per frame based on state
function getSweepSpeed(state: PlaybackState | undefined): number {
  switch (state) {
    case 'playing': return 0.06;
    case 'loading': return 0.12;
    case 'paused': return 0.015;
    case 'error': return 0;
    default: return 0.02; // stopped/idle — very slow
  }
}

export function RadarWidget({ size = 72, className = '', playbackState, isActive }: RadarWidgetProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const angleRef = useRef(0);
  const stateRef = useRef(playbackState);

  // Keep stateRef in sync without restarting the animation loop
  useEffect(() => {
    stateRef.current = playbackState;
  }, [playbackState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 2;

    // A few blips
    const blips = Array.from({ length: 3 }, () => ({
      angle: Math.random() * Math.PI * 2,
      dist: Math.random() * 0.55 + 0.2,
      opacity: 0,
    }));

    function draw() {
      const currentState = stateRef.current;
      const speed = getSweepSpeed(currentState);

      ctx!.clearRect(0, 0, size, size);

      // Background circle
      ctx!.fillStyle = 'oklch(0.1 0.012 145)';
      ctx!.beginPath();
      ctx!.arc(cx, cy, r, 0, Math.PI * 2);
      ctx!.fill();

      // Error state — dim static ring, no sweep
      if (currentState === 'error') {
        ctx!.strokeStyle = 'rgba(220, 60, 60, 0.4)';
        ctx!.lineWidth = 1;
        ctx!.beginPath();
        ctx!.arc(cx, cy, r, 0, Math.PI * 2);
        ctx!.stroke();
        // X mark
        ctx!.strokeStyle = 'rgba(220, 60, 60, 0.5)';
        ctx!.lineWidth = 1;
        ctx!.beginPath();
        ctx!.moveTo(cx - r * 0.35, cy - r * 0.35);
        ctx!.lineTo(cx + r * 0.35, cy + r * 0.35);
        ctx!.moveTo(cx + r * 0.35, cy - r * 0.35);
        ctx!.lineTo(cx - r * 0.35, cy + r * 0.35);
        ctx!.stroke();
        animFrameRef.current = requestAnimationFrame(draw);
        return;
      }

      // Grid circles — very subtle
      ctx!.strokeStyle = 'rgba(57, 255, 100, 0.1)';
      ctx!.lineWidth = 0.5;
      for (let i = 1; i <= 2; i++) {
        ctx!.beginPath();
        ctx!.arc(cx, cy, (r * i) / 2, 0, Math.PI * 2);
        ctx!.stroke();
      }

      // Sweep trail
      const sweepAngle = angleRef.current;
      const trailLength = Math.PI * 0.45;
      ctx!.save();
      ctx!.beginPath();
      ctx!.moveTo(cx, cy);
      ctx!.arc(cx, cy, r, sweepAngle - trailLength, sweepAngle);
      ctx!.closePath();
      const grad = ctx!.createRadialGradient(cx, cy, 0, cx, cy, r);
      grad.addColorStop(0, 'rgba(57, 255, 100, 0)');
      grad.addColorStop(1, 'rgba(57, 255, 100, 0.1)');
      ctx!.fillStyle = grad;
      ctx!.fill();
      ctx!.restore();

      // Sweep line
      ctx!.save();
      ctx!.strokeStyle = 'rgba(57, 255, 100, 0.85)';
      ctx!.lineWidth = 1;
      ctx!.shadowColor = '#39ff64';
      ctx!.shadowBlur = 4;
      ctx!.beginPath();
      ctx!.moveTo(cx, cy);
      ctx!.lineTo(cx + Math.cos(sweepAngle) * r, cy + Math.sin(sweepAngle) * r);
      ctx!.stroke();
      ctx!.restore();

      // Blips — only show when playing or loading
      if (currentState === 'playing' || currentState === 'loading') {
        blips.forEach((blip) => {
          const angleDiff = ((sweepAngle - blip.angle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
          if (angleDiff < 0.2) {
            blip.opacity = 1;
          } else {
            blip.opacity = Math.max(0, blip.opacity - 0.012);
          }
          if (blip.opacity > 0) {
            const bx = cx + Math.cos(blip.angle) * r * blip.dist;
            const by = cy + Math.sin(blip.angle) * r * blip.dist;
            ctx!.save();
            ctx!.fillStyle = `rgba(57, 255, 100, ${blip.opacity})`;
            ctx!.shadowColor = '#39ff64';
            ctx!.shadowBlur = 5;
            ctx!.beginPath();
            ctx!.arc(bx, by, 1.5, 0, Math.PI * 2);
            ctx!.fill();
            ctx!.restore();
          }
        });
      }

      // Outer ring
      ctx!.strokeStyle = 'rgba(57, 255, 100, 0.4)';
      ctx!.lineWidth = 0.75;
      ctx!.beginPath();
      ctx!.arc(cx, cy, r, 0, Math.PI * 2);
      ctx!.stroke();

      // Center dot
      ctx!.fillStyle = 'rgba(57, 255, 100, 0.7)';
      ctx!.beginPath();
      ctx!.arc(cx, cy, 1.5, 0, Math.PI * 2);
      ctx!.fill();

      if (speed > 0) {
        angleRef.current = (angleRef.current + speed) % (Math.PI * 2);
      }

      animFrameRef.current = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [size]);

  return (
    <div className={`relative shrink-0 ${className}`} style={{ width: size, height: size }}>
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="rounded-full"
        style={{ display: 'block' }}
      />
    </div>
  );
}
