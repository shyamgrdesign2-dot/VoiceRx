"use client"

import { Sparkles } from "lucide-react"

import { cn } from "@/lib/utils"

type Props = {
  modeLabel?: string
  transcript?: string
  onMinimize?: () => void
}

/**
 * Compact loader rendered on the back face of the agent panel between
 * submit and the result tabs. Keeps the same top bar layout as the
 * recorder / result-tabs (back+heading on the left, minimize on the
 * right) so the surface doesn't visually jump while the structured rx
 * is being generated. The back arrow is intentionally inert here —
 * cancelling mid-processing is not a supported flow.
 */
import { useEffect, useState } from "react"

export function VoiceRxInPanelLoader({ modeLabel = "Conversation Mode", transcript = "", onMinimize }: Props) {
  const [loadingStep, setLoadingStep] = useState(0)
  
  useEffect(() => {
    const timer1 = setTimeout(() => setLoadingStep(1), 1500)
    const timer2 = setTimeout(() => setLoadingStep(2), 3000)
    return () => { clearTimeout(timer1); clearTimeout(timer2) }
  }, [])
  
  const loadingText = [
    "Transcribing your information...",
    "Structuring EMR...",
    "Your transcript is ready!"
  ][loadingStep]

  const loadingDesc = [
    "Converting audio to text...",
    "Organizing symptoms, diagnosis, and medications...",
    "Finalizing details..."
  ][loadingStep]

  return (
    <div className="relative flex h-full w-full flex-col bg-white">
      <div className="shrink-0 flex items-center justify-between gap-2 px-3 pt-3 pb-2.5">
        <span className={cn("vrx-rt-mode-pill inline-flex items-center gap-[7px] rounded-[10px] py-[5px] pl-[10px] pr-[12px]")}>
          <span className="text-[13.5px] font-semibold leading-none text-tp-slate-700" style={{ letterSpacing: "0.1px" }}>{modeLabel}</span>
        </span>
        {onMinimize && (
          <button
            type="button"
            onClick={onMinimize}
            aria-label="Minimize agent"
            className="vrx-rt-glossy flex h-[32px] w-[32px] items-center justify-center rounded-[10px] text-tp-slate-600 transition-colors hover:text-tp-slate-900 active:scale-[0.95]"
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect x="3" y="3" width="18" height="18" rx="3.5" stroke="currentColor" strokeWidth="1.7" />
              <path d="M9 3v18" stroke="currentColor" strokeWidth="1.7" />
              <path d="M13 9l3 3-3 3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6">
        
        {/* Minimal transcript view */}
        {transcript && (
          <div className="w-full max-w-[280px] rounded-[12px] bg-tp-slate-50/80 px-4 py-3 border border-tp-slate-100 mb-2">
            <p className="line-clamp-3 text-center text-[12.5px] italic text-tp-slate-600 leading-[1.6]">
              "{transcript}"
            </p>
          </div>
        )}

        <div className="vrx-loader-orb relative inline-flex h-[72px] w-[72px] items-center justify-center rounded-full">
          <span className="vrx-loader-orb-glow absolute inset-0 rounded-full" aria-hidden />
          <Sparkles size={26} strokeWidth={2.2} className="relative text-white" aria-hidden />
        </div>
        <div className="text-center min-h-[48px]">
          <p className="text-[14px] font-semibold tracking-[-0.01em] text-tp-slate-800 transition-opacity duration-300">
            {loadingText}
          </p>
          <p className="mt-1 text-[12px] leading-[1.5] text-tp-slate-500 transition-opacity duration-300">
            {loadingDesc}
          </p>
        </div>
        <div className="vrx-loader-bar relative h-[4px] w-[140px] overflow-hidden rounded-full bg-tp-slate-100">
          <span className="vrx-loader-bar-fill absolute inset-y-0 w-1/3 rounded-full" aria-hidden />
        </div>
      </div>

      <style>{`
        .vrx-rt-mode-pill {
          background:
            linear-gradient(180deg, rgba(255,255,255,0.48) 0%, rgba(255,255,255,0.20) 100%),
            linear-gradient(135deg, rgba(213,101,234,0.16) 0%, rgba(103,58,172,0.12) 55%, rgba(75,74,213,0.12) 100%);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.85),
            inset 0 0 0 1px rgba(103,58,172,0.14),
            0 4px 12px -4px rgba(103,58,172,0.12);
        }
        .vrx-rt-glossy {
          background:
            linear-gradient(180deg, rgba(255,255,255,0.48) 0%, rgba(255,255,255,0.22) 100%),
            linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(75,74,213,0.08) 100%);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.85),
            inset 0 0 0 1px rgba(15,23,42,0.08),
            0 4px 12px -4px rgba(15,23,42,0.08);
        }
        .vrx-loader-orb {
          background: linear-gradient(135deg, #D565EA 0%, #673AAC 55%, #1A1994 100%);
          background-size: 200% 100%;
          animation: vrxLoaderShift 4s ease-in-out infinite;
          box-shadow: 0 12px 28px -10px rgba(103, 58, 172, 0.45), inset 0 1px 0 rgba(255,255,255,0.45);
        }
        .vrx-loader-orb-glow {
          background: radial-gradient(closest-side, rgba(213,101,234,0.55), rgba(213,101,234,0));
          animation: vrxLoaderPulse 1.6s ease-in-out infinite;
        }
        .vrx-loader-bar-fill {
          background: linear-gradient(90deg, #D565EA 0%, #673AAC 50%, #1A1994 100%);
          animation: vrxLoaderSlide 1.4s linear infinite;
        }
        @keyframes vrxLoaderShift { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        @keyframes vrxLoaderPulse { 0%,100% { transform: scale(1); opacity: 0.65; } 50% { transform: scale(1.18); opacity: 0.95; } }
        @keyframes vrxLoaderSlide { 0% { transform: translateX(-110%); } 100% { transform: translateX(420%); } }
      `}</style>
    </div>
  )
}
