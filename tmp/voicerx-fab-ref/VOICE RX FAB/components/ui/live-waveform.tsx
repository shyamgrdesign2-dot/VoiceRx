'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';

import styles from './live-waveform.module.css';

type LiveWaveformProps = {
  active?: boolean;
  barColor?: string;
  barGap?: number;
  barHeight?: number;
  barWidth?: number;
  className?: string;
  fadeEdges?: boolean;
  height?: number;
  historySize?: number;
  mode?: 'static' | 'scrolling';
  processing?: boolean;
  stream?: MediaStream | null;
};

export function LiveWaveform({
  active = false,
  barColor = '#3b82f6',
  barGap = 2,
  barHeight = 6,
  barWidth = 4,
  className,
  fadeEdges = true,
  height = 100,
  historySize = 120,
  mode = 'static',
  processing = false,
  stream = null,
}: LiveWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const internalStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const historyRef = useRef<number[]>([]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    };

    updateCanvasSize();

    const observer = new ResizeObserver(updateCanvasSize);
    observer.observe(canvas);
    resizeObserverRef.current = observer;

    return () => {
      observer.disconnect();
      resizeObserverRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (stream || !active || typeof navigator === 'undefined') {
      return;
    }

    let cancelled = false;

    const startCapture = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        return;
      }

      try {
        const capturedStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            autoGainControl: true,
            echoCancellation: true,
            noiseSuppression: true,
          },
        });

        if (cancelled) {
          capturedStream.getTracks().forEach((track) => track.stop());
          return;
        }

        internalStreamRef.current = capturedStream;
      } catch {
        internalStreamRef.current = null;
      }
    };

    void startCapture();

    return () => {
      cancelled = true;

      if (internalStreamRef.current) {
        internalStreamRef.current.getTracks().forEach((track) => track.stop());
        internalStreamRef.current = null;
      }
    };
  }, [active, stream]);

  useEffect(() => {
    const effectiveStream = stream ?? internalStreamRef.current;

    if (!effectiveStream) {
      analyserRef.current = null;
      sourceRef.current = null;

      if (audioContextRef.current) {
        void audioContextRef.current.close();
        audioContextRef.current = null;
      }

      return;
    }

    const audioContext = new window.AudioContext();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(effectiveStream);

    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.76;
    source.connect(analyser);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
    sourceRef.current = source;

    return () => {
      source.disconnect();
      analyser.disconnect();
      analyserRef.current = null;
      sourceRef.current = null;
      void audioContext.close();

      if (audioContextRef.current === audioContext) {
        audioContextRef.current = null;
      }
    };
  }, [stream, active]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const dataArray = new Uint8Array(128);

    const draw = () => {
      const context = canvas.getContext('2d');
      if (!context) {
        return;
      }

      const width = canvas.width;
      const canvasHeight = canvas.height;
      const centerY = canvasHeight / 2;
      const barSpan = barWidth + barGap;
      const barCount = Math.max(1, Math.floor((width + barGap) / barSpan));
      const totalWidth = barCount * barSpan - barGap;
      const offsetX = (width - totalWidth) / 2;
      const analyser = analyserRef.current;

      context.clearRect(0, 0, width, canvasHeight);

      let levels: number[] = [];

      if (active && analyser) {
        analyser.getByteFrequencyData(dataArray);

        if (mode === 'scrolling') {
          const average =
            dataArray.slice(0, 48).reduce((sum, value) => sum + value, 0) / 48;
          const normalized = average / 255;

          historyRef.current = [...historyRef.current, normalized].slice(
            -Math.max(barCount, historySize),
          );
          levels = historyRef.current.slice(-barCount);
        } else {
          levels = Array.from({ length: barCount }, (_, index) => {
            const centerDistance =
              barCount > 1
                ? Math.abs(index - (barCount - 1) / 2) / ((barCount - 1) / 2)
                : 0;
            const centerBias = 1 - centerDistance;
            const sampleIndex = Math.min(
              dataArray.length - 1,
              Math.floor((0.04 + centerDistance * 0.32) * dataArray.length),
            );
            const rawLevel = dataArray[sampleIndex] / 255;

            return Math.min(1, rawLevel * (1.2 + centerBias * 0.9));
          });
        }
      } else {
        const time = performance.now() / 1000;

        levels = Array.from({ length: barCount }, (_, index) => {
          const baseWave =
            (Math.sin(time * (processing ? 4.2 : 2.3) + index * 0.55) + 1) / 2;
          return processing ? 0.22 + baseWave * 0.5 : 0.08 + baseWave * 0.12;
        });
      }

      levels.forEach((level, index) => {
        const normalizedIndex =
          barCount > 1 ? Math.abs(index - (barCount - 1) / 2) / ((barCount - 1) / 2) : 0;
        const centerBias = 1 - normalizedIndex;
        const alpha = fadeEdges ? 1 - normalizedIndex * 0.42 : 1;
        const minHeight = Math.max(barHeight, canvasHeight * 0.18);
        const computedHeight = Math.max(
          minHeight,
          level * (processing ? canvasHeight * 0.92 : canvasHeight * 1.12) +
            centerBias * canvasHeight * 0.08,
        );
        const x = offsetX + index * barSpan;
        const y = centerY - computedHeight / 2;

        context.globalAlpha = alpha;
        context.fillStyle = barColor;
        context.beginPath();
        context.roundRect(x, y, barWidth, computedHeight, barWidth / 2);
        context.fill();
      });

      context.globalAlpha = 1;
      frameRef.current = window.requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [
    active,
    barColor,
    barGap,
    barHeight,
    barWidth,
    fadeEdges,
    historySize,
    mode,
    processing,
    stream,
  ]);

  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      <canvas
        aria-hidden="true"
        className={styles.canvas}
        ref={canvasRef}
        style={{ height, width: '100%' }}
      />
    </div>
  );
}
