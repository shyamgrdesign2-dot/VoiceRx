"use client"

import { Sparkles } from "lucide-react"

interface CopyToRxPadOverlayProps {
  active: boolean
  /** Match the right offset used by FullscreenAiOverlay / VoiceRxLiveBorder
   *  so the Dr. Agent rail stays crisp & untouched while the rest of the
   *  RxPad blurs behind the caption. */
  rightOffset?: number
}

/**
 * Soft "Copying data into RxPad…" overlay shown for ~2.5s before the
 * doctor's copy / fill-to-RxPad action actually fires. Pairs with the
 * existing VoiceRxLiveBorder edge aura so the action reads as a single
 * coordinated AI-mediated fill rather than an instant clipboard write.
 */
export function CopyToRxPadOverlay({ active, rightOffset = 0 }: CopyToRxPadOverlayProps) {
  if (!active) return null
  return (
    <div
      className="vrx-copy-overlay pointer-events-auto fixed left-0 bottom-0 z-[24] flex items-center justify-center"
      style={{ top: 62, right: rightOffset }}
      aria-live="polite"
      role="status"
    >
      <div className="vrx-copy-overlay-bg absolute inset-0" aria-hidden />
      <div className="vrx-copy-overlay-card relative flex items-center gap-[10px] rounded-[14px] bg-white/85 px-[18px] py-[12px] shadow-[0_18px_40px_-22px_rgba(15,23,42,0.35),0_0_0_1px_rgba(75,74,213,0.12)]">
        {/* Animated sparkle icon — a brand-tinted Sparkles glyph that
            twinkles + gently rotates so the overlay reads as actively
            "thinking" rather than a static badge. Layered over a soft
            radial halo so it reads against any surface behind. */}
        <span
          className="vrx-copy-overlay-spark relative inline-flex h-[26px] w-[26px] items-center justify-center"
          aria-hidden
        >
          <span className="vrx-copy-overlay-halo absolute inset-0 rounded-full" />
          <Sparkles
            size={18}
            strokeWidth={2.2}
            className="vrx-copy-overlay-sparkle relative"
          />
        </span>
        <span
          className="vrx-copy-overlay-caption text-[14px] font-semibold leading-[1.4]"
          style={{
            backgroundImage:
              "linear-gradient(100deg, #45455c 0%, #45455c 32%, #D565EA 46%, #673AAC 50%, #1A1994 54%, #45455c 68%, #45455c 100%)",
            backgroundSize: "200% 100%",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            paddingBottom: 2,
          }}
        >
          Copying data into RxPad…
        </span>
      </div>
      <style>{`
        .vrx-copy-overlay-bg {
          background: rgba(255,255,255,0.32);
          backdrop-filter: blur(10px) saturate(140%);
          -webkit-backdrop-filter: blur(10px) saturate(140%);
          animation: vrxCopyOverlayFade 220ms ease-out both;
        }
        .vrx-copy-overlay-card {
          animation: vrxCopyOverlayCardIn 320ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .vrx-copy-overlay-caption {
          animation: vrxCaptionShine 2.4s linear infinite;
        }
        .vrx-copy-overlay-halo {
          background: radial-gradient(circle at 50% 50%, rgba(213,101,234,0.32) 0%, rgba(103,58,172,0.18) 40%, rgba(26,25,148,0) 70%);
          animation: vrxCopyOverlayHalo 1.6s ease-in-out infinite;
        }
        .vrx-copy-overlay-sparkle {
          color: #673AAC;
          filter: drop-shadow(0 0 4px rgba(213,101,234,0.55));
          transform-origin: 50% 50%;
          animation:
            vrxCopyOverlaySparkleSpin 2.6s linear infinite,
            vrxCopyOverlaySparkleTwinkle 1.4s ease-in-out infinite;
        }
        @keyframes vrxCopyOverlayFade {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes vrxCopyOverlayCardIn {
          0%   { opacity: 0; transform: translateY(6px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0)    scale(1); }
        }
        @keyframes vrxCopyOverlayHalo {
          0%, 100% { transform: scale(1);    opacity: 0.6; }
          50%      { transform: scale(1.18); opacity: 1; }
        }
        @keyframes vrxCopyOverlaySparkleSpin {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes vrxCopyOverlaySparkleTwinkle {
          0%, 100% { filter: drop-shadow(0 0 4px rgba(213,101,234,0.55)) brightness(1); }
          50%      { filter: drop-shadow(0 0 10px rgba(213,101,234,0.85)) brightness(1.25); }
        }
        @media (prefers-reduced-motion: reduce) {
          .vrx-copy-overlay-bg,
          .vrx-copy-overlay-card,
          .vrx-copy-overlay-caption,
          .vrx-copy-overlay-halo,
          .vrx-copy-overlay-sparkle { animation: none; }
        }
      `}</style>
    </div>
  )
}
