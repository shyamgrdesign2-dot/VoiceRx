"use client"

import { useEffect, useState } from "react"

import { VOICE_RX_LOADER_HINTS } from "@/components/voicerx/voice-session-utils"
import { cn } from "@/lib/utils"

interface Props {
  active: boolean
  className?: string
}

/**
 * RxPad AI overlay — heavy backdrop-blur on the underlying content with a
 * centred AI loading state, TP AI gradient corners, and progress indicator.
 */
export function RxPadAiOverlay({ active, className }: Props) {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    if (!active) return
    setIdx(0)
    const iv = setInterval(() => setIdx((i) => (i + 1) % VOICE_RX_LOADER_HINTS.length), 2400)
    return () => clearInterval(iv)
  }, [active])

  if (!active) return null

  return (
    <div
      className={cn(
        "pointer-events-auto absolute inset-0 z-40 flex flex-col items-center justify-center overflow-hidden",
        className,
      )}
      aria-live="polite"
      role="status"
      style={{ animation: "rxOverlayFade 400ms ease-out both" }}
    >
      {/* ── Heavy backdrop blur — full-obscure pass so only the loader reads ── */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backdropFilter: "blur(72px) saturate(1.5)",
          WebkitBackdropFilter: "blur(72px) saturate(1.5)",
          background: "rgba(255,255,255,0.72)",
        }}
      />

      {/* ── Corner gradient accents — TP AI gradient: pink + violet + blue ── */}
      <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden>
        {/* Top-left — pink */}
        <div
          className="absolute left-0 top-0"
          style={{
            width: "45%",
            height: "40%",
            background: "radial-gradient(ellipse at 0% 0%, rgba(213,101,234,0.22) 0%, rgba(213,101,234,0.08) 40%, transparent 70%)",
            animation: "rxCornerPulse 3.5s ease-in-out infinite",
          }}
        />
        {/* Top-right — violet */}
        <div
          className="absolute right-0 top-0"
          style={{
            width: "45%",
            height: "40%",
            background: "radial-gradient(ellipse at 100% 0%, rgba(103,58,172,0.22) 0%, rgba(139,92,246,0.08) 40%, transparent 70%)",
            animation: "rxCornerPulse 3.5s ease-in-out 0.9s infinite",
          }}
        />
        {/* Bottom-right — blue */}
        <div
          className="absolute bottom-0 right-0"
          style={{
            width: "45%",
            height: "40%",
            background: "radial-gradient(ellipse at 100% 100%, rgba(26,25,148,0.20) 0%, rgba(75,74,213,0.08) 40%, transparent 70%)",
            animation: "rxCornerPulse 3.5s ease-in-out 1.8s infinite",
          }}
        />
        {/* Bottom-left — pink+violet blend */}
        <div
          className="absolute bottom-0 left-0"
          style={{
            width: "45%",
            height: "40%",
            background: "radial-gradient(ellipse at 0% 100%, rgba(213,101,234,0.18) 0%, rgba(103,58,172,0.06) 40%, transparent 70%)",
            animation: "rxCornerPulse 3.5s ease-in-out 2.7s infinite",
          }}
        />
      </div>

      {/* ── Edge gradient sweep — TP AI gradient rotating around border ── */}
      <div className="pointer-events-none absolute inset-0 z-[2]" aria-hidden>
        <div
          className="absolute inset-0"
          style={{
            background: "conic-gradient(from var(--rx-sweep-angle, 0deg) at 50% 50%, transparent 0deg, rgba(213,101,234,0.15) 30deg, rgba(103,58,172,0.20) 60deg, rgba(26,25,148,0.12) 90deg, transparent 150deg, transparent 360deg)",
            mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            maskComposite: "exclude",
            WebkitMaskComposite: "xor",
            padding: 20,
            animation: "rxSweep 4s linear infinite",
          }}
        />
      </div>

      {/* ── Centred content ── */}
      <div className="relative z-[3] flex flex-col items-center gap-[20px] px-6">
        {/* Rotating TP AI spark — same coin-flip + halo family as the
            chat TypingIndicator & VoiceRxLoaderCard. Using the shared
            visual grammar here so every "AI is thinking" moment in the
            product reads as the same loader, not a bespoke spinner. */}
        <span className="rx-overlay-spark relative inline-flex items-center justify-center" aria-hidden>
          <span className="rx-overlay-halo" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/dr-agent/spark-icon.svg"
            alt=""
            draggable={false}
            width={52}
            height={52}
            className="rx-overlay-flip pointer-events-none relative select-none"
          />
        </span>

        {/* Label */}
        <p
          className="text-[14px] font-semibold tracking-[0.3px]"
          style={{
            background: "linear-gradient(91deg, #D565EA 3%, #673AAC 67%, #1A1994 130%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Structuring your Rx
        </p>

        {/* Transcript hint carousel */}
        <div className="relative h-[20px] w-[260px] overflow-hidden text-center">
          {VOICE_RX_LOADER_HINTS.map((h, i) => (
            <span
              key={h}
              className={cn(
                "absolute inset-x-0 text-[14px] font-medium transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                i === idx
                  ? "translate-y-0 opacity-100"
                  : i === (idx - 1 + VOICE_RX_LOADER_HINTS.length) % VOICE_RX_LOADER_HINTS.length
                    ? "-translate-y-3 opacity-0"
                    : "translate-y-3 opacity-0",
              )}
              style={{ color: "#64748B" }}
            >
              {h}
            </span>
          ))}
        </div>

        {/* Progress bar — wider */}
        <div
          className="relative h-[3px] w-[220px] overflow-hidden rounded-full"
          style={{ background: "rgba(103,58,172,0.10)" }}
          aria-hidden
        >
          <span
            className="absolute inset-y-0 w-[45%] rounded-full"
            style={{
              background: "linear-gradient(90deg, rgba(213,101,234,0.3), rgba(103,58,172,0.85), rgba(26,25,148,0.3))",
              animation: "rxProgress 1.8s ease-in-out infinite",
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes rxOverlayFade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        /* Coin-flip TP AI spark + breathing halo — identical motion
           grammar as the chat TypingIndicator & VoiceRxLoaderCard. */
        .rx-overlay-spark {
          width: 72px;
          height: 72px;
          perspective: 800px;
        }
        .rx-overlay-flip {
          display: inline-block;
          transform-style: preserve-3d;
          animation: rxOverlayFlip 2.2s cubic-bezier(0.6, 0, 0.4, 1) infinite;
          filter: drop-shadow(0 4px 10px rgba(103, 58, 172, 0.25));
        }
        .rx-overlay-halo {
          position: absolute;
          inset: -6px;
          border-radius: 9999px;
          background: radial-gradient(circle at 50% 50%,
            rgba(213, 101, 234, 0.34) 0%,
            rgba(139, 92, 246, 0.24) 40%,
            rgba(75, 74, 213, 0) 75%);
          animation: rxOverlayHalo 2.2s ease-in-out infinite;
        }
        @keyframes rxOverlayFlip {
          0%   { transform: rotateY(0deg) scale(1); }
          25%  { transform: rotateY(180deg) scale(1.12); }
          50%  { transform: rotateY(360deg) scale(1); }
          75%  { transform: rotateY(540deg) scale(1.12); }
          100% { transform: rotateY(720deg) scale(1); }
        }
        @keyframes rxOverlayHalo {
          0%, 100% { opacity: 0.55; transform: scale(0.88); }
          50%      { opacity: 1;    transform: scale(1.18); }
        }
        @media (prefers-reduced-motion: reduce) {
          .rx-overlay-flip, .rx-overlay-halo { animation: none; }
          .rx-overlay-halo { opacity: 0.5; }
        }
        @keyframes rxProgress {
          0%   { left: -45%; }
          100% { left: 100%; }
        }
        @keyframes rxCornerPulse {
          0%, 100% { opacity: 0.7; }
          50%      { opacity: 1; }
        }
        @keyframes rxSweep {
          from { --rx-sweep-angle: 0deg; }
          to   { --rx-sweep-angle: 360deg; }
        }
        @property --rx-sweep-angle {
          syntax: '<angle>';
          inherits: false;
          initial-value: 0deg;
        }
      `}</style>
    </div>
  )
}
