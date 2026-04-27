'use client';

import { TickCircle } from 'iconsax-react';
import type { CSSProperties } from 'react';
import { useEffect, useId, useRef, useState } from 'react';

import { LiveWaveform } from './ui/live-waveform';
import styles from './voice-assistant-fab.module.css';

type VoiceAssistantFabProps = {
  className?: string;
  label?: string;
  title?: string;
  waveHeight?: number;
  waveWidth?: number | string;
};

const FAB_PATH =
  'M395.24 23.6125C381.35 31.5666 366.81 41.5232 360.83 55.4195C352.63 74.3548 341.13 86.7689 319.47 86.769H110.53C88.87 86.7689 77.37 74.3548 69.17 55.4195C63.19 41.5232 48.62 31.5666 34.73 23.6125L28.43 20H401.32L395.24 23.6125Z';

function formatDuration(durationSeconds: number) {
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function VoiceMicIcon({
  className,
  size = 24,
  color = '#000000',
}: {
  className?: string;
  color?: string;
  size?: number;
}) {
  return (
    <svg
      className={className}
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g clipPath="url(#voice-mic-clip)">
        <path
          d="M19.1199 9.12035C18.7299 9.12035 18.4199 9.43035 18.4199 9.82035V11.4004C18.4199 14.9404 15.5399 17.8204 11.9999 17.8204C8.45993 17.8204 5.57993 14.9404 5.57993 11.4004V9.81035C5.57993 9.42035 5.26993 9.11035 4.87993 9.11035C4.48993 9.11035 4.17993 9.42035 4.17993 9.81035V11.3904C4.17993 15.4604 7.30993 18.8104 11.2999 19.1704V21.3004C11.2999 21.6904 11.6099 22.0004 11.9999 22.0004C12.3899 22.0004 12.6999 21.6904 12.6999 21.3004V19.1704C16.6799 18.8204 19.8199 15.4604 19.8199 11.3904V9.81035C19.8099 9.43035 19.4999 9.12035 19.1199 9.12035Z"
          fill={color}
        />
        <path
          d="M12.0001 2C9.56008 2 7.58008 3.98 7.58008 6.42V11.54C7.58008 13.98 9.56008 15.96 12.0001 15.96C14.4401 15.96 16.4201 13.98 16.4201 11.54V6.42C16.4201 3.98 14.4401 2 12.0001 2ZM13.3101 8.95C13.2401 9.21 13.0101 9.38 12.7501 9.38C12.7001 9.38 12.6501 9.37 12.6001 9.36C12.2101 9.25 11.8001 9.25 11.4101 9.36C11.0901 9.45 10.7801 9.26 10.7001 8.95C10.6101 8.64 10.8001 8.32 11.1101 8.24C11.7001 8.08 12.3201 8.08 12.9101 8.24C13.2101 8.32 13.3901 8.64 13.3101 8.95ZM13.8401 7.01C13.7501 7.25 13.5301 7.39 13.2901 7.39C13.2201 7.39 13.1601 7.38 13.0901 7.36C12.3901 7.1 11.6101 7.1 10.9101 7.36C10.6101 7.47 10.2701 7.31 10.1601 7.01C10.0501 6.71 10.2101 6.37 10.5101 6.27C11.4701 5.92 12.5301 5.92 13.4901 6.27C13.7901 6.38 13.9501 6.71 13.8401 7.01Z"
          fill={color}
        />
      </g>
      <defs>
        <clipPath id="voice-mic-clip">
          <rect fill="white" height="24" width="24" />
        </clipPath>
      </defs>
    </svg>
  );
}

export function VoiceAssistantFab({
  className,
  label = "I'm listening",
  title = 'Voice assistant listening FAB',
  waveHeight = 28,
  waveWidth = 100,
}: VoiceAssistantFabProps) {
  const id = useId();
  const shadowId = `${id}-shadow`;
  const shellId = `${id}-shell`;
  const clipId = `${id}-clip`;

  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isMicReady, setIsMicReady] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  function stopListening() {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setAudioStream(null);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }

  async function startListening() {
    stopListening();

    if (
      typeof window === 'undefined' ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setIsMicReady(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      startTimeRef.current = Date.now();

      setElapsedSeconds(0);
      setAudioStream(stream);
      setIsMicReady(true);

      timerRef.current = window.setInterval(() => {
        setElapsedSeconds(
          Math.floor((Date.now() - startTimeRef.current) / 1000),
        );
      }, 1000);
    } catch {
      setIsMicReady(false);
    }
  }

  useEffect(() => {
    void startListening();

    return () => {
      stopListening();
    };
  }, []);

  const contentStyle = {
    '--voice-wave-height': `${waveHeight}px`,
    '--voice-wave-width':
      typeof waveWidth === 'number' ? `${waveWidth}px` : waveWidth,
  } as CSSProperties;

  return (
    <button
      aria-label={title}
      className={[styles.root, className].filter(Boolean).join(' ')}
      onClick={() => {
        if (!isMicReady) {
          void startListening();
        }
      }}
      type="button"
    >
      <svg
        aria-hidden="true"
        className={styles.shell}
        viewBox="0 0 430 115"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter
            height="114.769"
            id={shadowId}
            width="430"
            x="0"
            y="0"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feOffset dy="4" />
            <feGaussianBlur stdDeviation="12" />
            <feComposite in2="hardAlpha" operator="out" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.175838 0 0 0 0 0.173404 0 0 0 0 0.173404 0 0 0 0.42 0"
            />
            <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow" />
            <feBlend
              in="SourceGraphic"
              in2="effect1_dropShadow"
              mode="normal"
              result="shape"
            />
          </filter>
          <linearGradient id={shellId} x1="28.43" x2="401.32" y1="53.3845" y2="53.3845">
            <stop stopColor="#402753" />
            <stop offset="1" stopColor="#1A1021" />
          </linearGradient>
          <clipPath id={clipId}>
            <path d={FAB_PATH} />
          </clipPath>
        </defs>
        <g filter={`url(#${shadowId})`}>
          <path d={FAB_PATH} fill={`url(#${shellId})`} />
        </g>

        <foreignObject
          className={styles.foreignObject}
          clipPath={`url(#${clipId})`}
          height="115"
          width="430"
          x="0"
          y="0"
        >
          <div className={styles.content} style={contentStyle}>
            <span className={styles.iconSurface}>
              <VoiceMicIcon
                className={styles.micIcon}
                color="#F59E0B"
                size={42}
              />
            </span>

            <span className={styles.centerStack}>
              <span className={styles.waveRow}>
                <span className={styles.waveWrap}>
                  <LiveWaveform
                    active={Boolean(audioStream)}
                    barColor="#FFFFFF"
                    barGap={2}
                    barHeight={6}
                    barWidth={4}
                    fadeEdges={true}
                    height={waveHeight}
                    mode="static"
                    stream={audioStream}
                  />
                </span>

                <span className={styles.timer}>{formatDuration(elapsedSeconds)}</span>
              </span>

              <span className={styles.statusRow}>
                <span className={styles.label}>{label}</span>
                <span aria-hidden="true" className={styles.dots}>
                  <span className={styles.dot} />
                  <span className={styles.dot} />
                  <span className={styles.dot} />
                </span>
              </span>
            </span>

            <span className={styles.checkSurface}>
              <TickCircle
                className={styles.submitIcon}
                color="#FFFFFF"
                size={42}
                variant="Broken"
              />
            </span>
          </div>
        </foreignObject>
      </svg>
    </button>
  );
}
