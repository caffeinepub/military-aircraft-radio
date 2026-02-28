import React, { useRef, useEffect, useCallback } from 'react';

interface AudioVisualizerProps {
  analyserNode: AnalyserNode | null;
  isActive: boolean;
  className?: string;
}

export function AudioVisualizer({ analyserNode, isActive, className = '' }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    analyserRef.current = analyserNode;
  }, [analyserNode]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const analyser = analyserRef.current;

    if (!isActive || !analyser) {
      // Draw flat idle line
      ctx.strokeStyle = 'rgba(57, 255, 100, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, H / 2);
      ctx.lineTo(W, H / 2);
      ctx.stroke();
      animFrameRef.current = requestAnimationFrame(draw);
      return;
    }

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    const BAR_COUNT = 16;
    const step = Math.floor(bufferLength / BAR_COUNT);
    const barW = Math.floor(W / BAR_COUNT);
    const gap = 1;

    for (let i = 0; i < BAR_COUNT; i++) {
      // Average a few bins per bar
      let sum = 0;
      for (let j = 0; j < step; j++) {
        sum += dataArray[i * step + j];
      }
      const avg = sum / step;
      const normalized = avg / 255;
      const barH = Math.max(1, normalized * H);

      const x = i * barW + gap;
      const y = H - barH;
      const w = barW - gap * 2;

      // Color: green for low, amber for high
      const greenL = 0.72 + normalized * 0.16;
      const alpha = 0.3 + normalized * 0.7;

      if (normalized > 0.65) {
        ctx.fillStyle = `rgba(200, 160, 40, ${alpha})`;
        ctx.shadowColor = 'rgba(200, 160, 40, 0.6)';
      } else {
        ctx.fillStyle = `rgba(57, 255, 100, ${alpha})`;
        ctx.shadowColor = 'rgba(57, 255, 100, 0.5)';
      }
      ctx.shadowBlur = normalized > 0.4 ? 4 : 0;
      ctx.fillRect(x, y, w, barH);
    }

    ctx.shadowBlur = 0;
    animFrameRef.current = requestAnimationFrame(draw);
  }, [isActive]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={128}
      height={24}
      className={className}
      style={{ display: 'block', imageRendering: 'pixelated' }}
    />
  );
}
