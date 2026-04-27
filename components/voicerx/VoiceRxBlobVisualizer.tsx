"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

const BLOB_COUNT = 7

/** TP-tuned blob gradients (inspired by visualiser-for-tp VoiceBlob, no framer-motion). */
const BLOB_BACKGROUNDS = [
  "linear-gradient(135deg, rgba(213,101,234,0.95) 0%, rgba(232,121,169,0.75) 100%)",
  "linear-gradient(135deg, rgba(232,121,169,0.9) 0%, rgba(213,101,234,0.85) 100%)",
  "linear-gradient(135deg, rgba(213,101,234,0.9) 0%, rgba(103,58,172,0.85) 100%)",
  "linear-gradient(135deg, rgba(103,58,172,0.9) 0%, rgba(75,74,213,0.8) 100%)",
  "linear-gradient(135deg, rgba(142,141,232,0.85) 0%, rgba(103,58,172,0.9) 100%)",
  "linear-gradient(135deg, rgba(75,74,213,0.88) 0%, rgba(213,101,234,0.75) 100%)",
  "linear-gradient(135deg, rgba(103,58,172,0.9) 0%, rgba(26,25,148,0.65) 100%)",
]

interface VoiceRxBlobVisualizerProps {
  stream?: MediaStream | null
  paused?: boolean
  className?: string
  /** Visual area height */
  height?: number
  /** Larger, softer blobs for full-panel ambient background */
  ambient?: boolean
}

/**
 * Organic “wobbling” blobs driven by mic levels — replaces Siri-style waveform for VoiceRx.
 * Adapts the zip reference visualiser to the parent’s MediaStream (no second getUserMedia).
 */
export function VoiceRxBlobVisualizer({
  stream,
  paused = false,
  className,
  height = 88,
  ambient = false,
}: VoiceRxBlobVisualizerProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const blobElsRef = useRef<(HTMLDivElement | null)[]>([])
  const ctxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const freqsRef = useRef<Uint8Array | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const rafRef = useRef<number | null>(null)
  const pausedRef = useRef(paused)

  useEffect(() => {
    pausedRef.current = paused
  }, [paused])

  useEffect(() => {
    if (stream) {
      try {
        const ctx = new AudioContext()
        const analyser = ctx.createAnalyser()
        analyser.smoothingTimeConstant = 0.72
        analyser.fftSize = 128
        analyser.minDecibels = -75
        analyser.maxDecibels = 0
        const src = ctx.createMediaStreamSource(stream)
        src.connect(analyser)
        ctxRef.current = ctx
        analyserRef.current = analyser
        freqsRef.current = new Uint8Array(analyser.frequencyBinCount)
        sourceRef.current = src
      } catch {
        /* idle motion only */
      }
    }

    const tick = (tMs: number) => {
      const t = tMs / 1000
      const analyser = analyserRef.current
      const freqs = freqsRef.current
      let level = 0
      if (analyser && freqs && !pausedRef.current) {
        analyser.getByteFrequencyData(freqs)
        level = freqs.reduce((a, b) => a + b, 0) / (freqs.length * 255)
      } else {
        level = pausedRef.current ? 0.05 : 0.12 + Math.sin(t * 2.1) * 0.08
      }

      const blobs = blobElsRef.current
      for (let i = 0; i < BLOB_COUNT; i++) {
        const el = blobs[i]
        if (!el) continue
        const phase = t * 3.35 + i * 0.92
        const wobble =
          Math.sin(phase) * (0.32 + level * 0.4) +
          Math.cos(phase * 1.35 + i) * (0.16 + level * 0.22) +
          Math.sin(phase * 0.62 + i * 1.7) * (0.06 + level * 0.1)
        const jitter = 0.52 + level * 1.55 + wobble
        const sx = 0.64 + jitter * 0.4
        const sy = 0.58 + jitter * 0.72
        const brX = 42 + Math.sin(phase * 1.05 + i) * 26
        const brY = 48 + Math.cos(phase * 0.82 + i * 0.55) * 24
        el.style.opacity = String(0.32 + level * 0.58 + (pausedRef.current ? 0.05 : 0))
        const driftY = Math.sin(phase * 0.88 + i) * (4 + level * 10)
        el.style.transform = `translateX(${(i - 3) * -8}px) translateY(${driftY}px) scale(${sx}, ${sy})`
        el.style.borderRadius = `${brX}% ${58 - brX * 0.3}% ${50 + brY * 0.08}% ${47}% / ${50}% ${brX * 0.9}% ${48}% ${52}%`
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      sourceRef.current?.disconnect()
      void ctxRef.current?.close().catch(() => {})
      ctxRef.current = null
      analyserRef.current = null
      freqsRef.current = null
      sourceRef.current = null
    }
  }, [stream])

  return (
    <div
      ref={wrapRef}
      className={cn("relative w-full overflow-hidden", className)}
      style={{ height }}
      aria-hidden
    >
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {Array.from({ length: BLOB_COUNT }).map((_, i) => (
          <div
            key={i}
            ref={(el) => {
              blobElsRef.current[i] = el
            }}
            className={
              ambient
                ? "absolute h-[88px] w-[142px] blur-[42px] sm:h-[104px] sm:w-[168px] sm:blur-[52px]"
                : "absolute h-[44px] w-[72px] blur-[22px] sm:h-[50px] sm:w-[88px] sm:blur-[26px]"
            }
            style={{
              background: BLOB_BACKGROUNDS[i % BLOB_BACKGROUNDS.length],
              left: "50%",
              top: "50%",
              marginLeft: ambient ? -71 - (i - 3) * 16 : -36 - (i - 3) * 8,
              marginTop: ambient ? -44 : -22,
              willChange: "transform, opacity",
            }}
          />
        ))}
      </div>
    </div>
  )
}
