import type React from "react";
import { useCallback, useEffect, useRef } from "react";

interface AudioVisualizerProps {
  analyserNode: AnalyserNode | null;
  isActive: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function AudioVisualizer({
  analyserNode,
  isActive,
  className = "",
  style,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    analyserRef.current = analyserNode;
  }, [analyserNode]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const analyser = analyserRef.current;

    if (!isActive || !analyser) {
      // Draw flat idle line
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
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

    const BAR_COUNT = 20;
    const step = Math.floor(bufferLength / BAR_COUNT);
    const barW = Math.floor(W / BAR_COUNT);
    const gap = 2;

    for (let i = 0; i < BAR_COUNT; i++) {
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

      // Monochrome: light grey to white based on intensity
      const lightness = Math.round(40 + normalized * 55);
      const alpha = 0.25 + normalized * 0.75;
      ctx.fillStyle = `rgba(${lightness * 2.3}, ${lightness * 2.3}, ${lightness * 2.3}, ${alpha})`;
      ctx.shadowBlur = 0;
      ctx.fillRect(x, y, w, barH);
    }

    animFrameRef.current = requestAnimationFrame(draw);
  }, [isActive]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [draw]);

  // Sync canvas size to rendered size when style changes
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          canvas.width = Math.round(width);
          canvas.height = Math.round(height);
        }
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={className} style={style}>
      <canvas
        ref={canvasRef}
        width={128}
        height={24}
        style={{ display: "block", width: "100%", height: "100%" }}
      />
    </div>
  );
}
