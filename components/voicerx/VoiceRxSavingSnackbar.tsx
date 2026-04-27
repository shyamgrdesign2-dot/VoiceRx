"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

import { cn } from "@/lib/utils"

interface VoiceRxSavingSnackbarProps {
  /** When true the snackbar slides in; when false it slides out then unmounts. */
  show: boolean
  /** Primary label. Defaults to the common voice-save copy. */
  label?: string
  /** Tone — solid black is the app standard; a variant is reserved for errors. */
  tone?: "info" | "error"
}

/**
 * Brand-standard snackbar: solid black pill, horizontally centered near the top
 * of the viewport, shown while a voice consultation is saving / generating.
 * Replaces the earlier ad-hoc loaders that didn't match the business design
 * system. Portaled to `document.body` so it escapes clipping containers.
 */
export function VoiceRxSavingSnackbar({
  show,
  label = "Saving consultation…",
  tone = "info",
}: VoiceRxSavingSnackbarProps) {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => setMounted(true), [])

  // Decouple mount/unmount from `show` so the exit animation can play.
  useEffect(() => {
    if (show) {
      setVisible(true)
      return
    }
    const t = setTimeout(() => setVisible(false), 240)
    return () => clearTimeout(t)
  }, [show])

  if (!mounted || !visible) return null

  const body = (
    <div
      className="pointer-events-none fixed left-1/2 top-[24px] z-[90] -translate-x-1/2"
      role="status"
      aria-live="polite"
    >
      <div
        className={cn(
          // Brand spec: solid black pill, white text, NO outer shadow.
          "vrx-snackbar pointer-events-auto flex items-center gap-[12px] rounded-full bg-black px-[18px] py-[10px] text-[13px] font-medium text-white",
        )}
        data-state={show ? "open" : "closed"}
      >
        {/* Triplet of breathing dots as the loader motif */}
        <div className="flex items-center gap-[4px]" aria-hidden>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="block h-[5px] w-[5px] rounded-full bg-white/90"
              style={{
                animation: `vrxSnackDot 1.2s ease-in-out ${i * 0.16}s infinite`,
              }}
            />
          ))}
        </div>
        <span className="leading-none tracking-[0.1px]">{label}</span>
      </div>
      <style jsx>{`
        .vrx-snackbar[data-state="open"] {
          animation: vrxSnackIn 320ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .vrx-snackbar[data-state="closed"] {
          animation: vrxSnackOut 220ms ease-in both;
        }
        @keyframes vrxSnackIn {
          from { opacity: 0; transform: translateY(-10px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)     scale(1); }
        }
        @keyframes vrxSnackOut {
          from { opacity: 1; transform: translateY(0)     scale(1); }
          to   { opacity: 0; transform: translateY(-6px)  scale(0.98); }
        }
        @keyframes vrxSnackDot {
          0%, 100% { transform: scale(0.7); opacity: 0.45; }
          50%      { transform: scale(1);   opacity: 1; }
        }
      `}</style>
    </div>
  )

  return createPortal(body, document.body)
}
