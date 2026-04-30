"use client"

import { useEffect, useRef } from "react"
import { Wifi, WifiOff } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { useNetConnection } from "./use-net-connection"

/**
 * Subscribes to connection quality while VoiceRx is open and surfaces changes
 * only via Sonner toasts (no inline banner in the recorder).
 *
 * Uses bottom-right (same as global Toaster) with extra bottom inset so toasts
 * sit above the VoiceRx control strip instead of covering it.
 */
// Align with the brand Toaster (top-center, black, white text). No
// per-toast style overrides — let the global config render them.
const VRX_NET_TOAST = {
  id: "vrx-net" as const,
  position: "top-center" as const,
}

export function VoiceRxNetToasts() {
  const { online, slowConnection, info } = useNetConnection()
  const lastWarningRef = useRef<"offline" | "slow" | "ok">("ok")

  useEffect(() => {
    const nextState: "offline" | "slow" | "ok" = !online ? "offline" : slowConnection ? "slow" : "ok"
    if (nextState !== lastWarningRef.current) {
      if (nextState === "offline") {
        toast.error("You're offline — transcription paused", {
          ...VRX_NET_TOAST,
        })
      } else if (nextState === "slow") {
        const description = info.effectiveType ? `Connection: ${info.effectiveType}` : undefined
        toast.warning("Internet unstable — transcription may lag", {
          ...VRX_NET_TOAST,
          ...(description ? { description } : {}),
        })
      } else if (lastWarningRef.current !== "ok") {
        toast.success("Connection restored", {
          ...VRX_NET_TOAST,
          duration: 2200,
        })
      }
      lastWarningRef.current = nextState
    }
  }, [online, slowConnection, info.effectiveType])

  return null
}

/** @deprecated Use {@link VoiceRxNetToasts} — inline banner removed in favor of Sonner only. */
export const VoiceRxNetAlertBanner = VoiceRxNetToasts

/** Wi‑Fi + Mbps pill — previous VoiceRx styling; use in a corner with low emphasis. */
export function NetSpeedChip({ className }: { className?: string }) {
  const { online, unstable, mbps } = useNetConnection()

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-[2px] text-[10px] font-medium tabular-nums backdrop-blur-sm",
        unstable ? "text-amber-700" : "text-tp-slate-500",
        className,
      )}
      title={online ? `Downlink ${mbps}` : "Offline"}
    >
      {online ? <Wifi size={11} strokeWidth={2.4} /> : <WifiOff size={11} strokeWidth={2.4} />}
      <span>{online ? mbps : "Offline"}</span>
    </span>
  )
}
