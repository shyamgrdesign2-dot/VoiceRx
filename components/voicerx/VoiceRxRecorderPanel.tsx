"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Check, ChevronDown, Mic, MicOff, X } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

import { NetSpeedChip, VoiceRxNetToasts } from "./NetSpeedChip"
import { VoiceRxBlobVisualizer } from "./VoiceRxBlobVisualizer"
import { VoiceRxSiriWaveform } from "./VoiceRxSiriWaveform"

interface VoiceRxRecorderPanelProps {
  onCancel: () => void
  onSubmit: () => void
}

/** TP-neutral menu item (override default accent / violet focus). */
const MENU_ITEM_TP =
  "cursor-pointer rounded-md text-[14px] text-tp-slate-700 outline-none hover:bg-tp-slate-100 hover:text-tp-slate-900 focus:bg-tp-slate-100 focus:text-tp-slate-900 data-[highlighted]:bg-tp-slate-100 data-[highlighted]:text-tp-slate-900"

/**
 * VoiceRx capture — glass controls, gradient Submit pill (check + label), ambient blobs.
 * Layout aligned with VoiceRx reference (mic pill + waveform + submit).
 */
export function VoiceRxRecorderPanel({ onCancel, onSubmit }: VoiceRxRecorderPanelProps) {
  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState("")
  const [micError, setMicError] = useState<string | null>(null)
  const [micLabel, setMicLabel] = useState("")
  const [muted, setMuted] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [stream, setStream] = useState<MediaStream | null>(null)

  const streamRef = useRef<MediaStream | null>(null)

  const loadDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) {
        setMicError("no-api")
        return
      }
      const list = await navigator.mediaDevices.enumerateDevices()
      const inputs = list.filter((d) => d.kind === "audioinput")
      setAudioInputs(inputs)
      if (inputs.length === 0) {
        setMicError("no-input")
        setSelectedDeviceId("")
      } else {
        setMicError((e) => (e === "no-input" ? null : e))
        setSelectedDeviceId((prev) => (prev && inputs.some((i) => i.deviceId === prev) ? prev : inputs[0].deviceId))
      }
    } catch {
      setMicError("enum-failed")
    }
  }, [])

  useEffect(() => {
    void loadDevices()
    const md = navigator.mediaDevices
    if (!md?.addEventListener) return
    const handler = () => loadDevices()
    md.addEventListener("devicechange", handler)
    return () => md.removeEventListener("devicechange", handler)
  }, [loadDevices])

  useEffect(() => {
    let cancelled = false
    const cleanup = () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
      setStream(null)
    }

    const run = async () => {
      cleanup()
      if (!selectedDeviceId) return
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: { exact: selectedDeviceId } },
        })
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = s
        setStream(s)
        setMicError(null)
        setMicLabel(s.getAudioTracks()[0]?.label || "Microphone")
        void navigator.mediaDevices.enumerateDevices().then((list) => {
          if (!cancelled) setAudioInputs(list.filter((d) => d.kind === "audioinput"))
        })
      } catch {
        if (!cancelled) {
          setMicError("denied")
          setMicLabel("")
        }
      }
    }

    void run()
    return () => {
      cancelled = true
      cleanup()
    }
  }, [selectedDeviceId])

  useEffect(() => {
    streamRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = !muted
    })
  }, [muted])

  useEffect(() => {
    if (!stream || micError) return
    const iv = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(iv)
  }, [stream, micError])

  const statusText = useMemo(() => {
    if (micError === "denied") return "Microphone blocked — allow access in browser settings"
    if (micError === "no-input") return "No microphone found"
    if (micError === "no-api") return "Audio not available in this context"
    if (micError === "enum-failed") return "Could not list microphones"
    if (muted) return "Muted — tap microphone to unmute"
    if (!stream) return "Connecting to microphone…"
    return "I'm listening…"
  }, [micError, muted, stream])

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0")
  const ss = String(elapsed % 60).padStart(2, "0")

  const isLive = !micError && !muted && !!stream

  return (
    <div className="relative min-h-0 overflow-hidden px-3 pb-2 pt-2 flex flex-col h-full">
      <VoiceRxNetToasts />
      
      {/* Mic Selection at top */}
      <div className="relative z-10 flex justify-center pb-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex items-center gap-2 rounded-full border border-tp-slate-200 bg-white/90 px-3 py-1.5 text-[12px] font-medium text-tp-slate-700 shadow-sm backdrop-blur-sm transition-colors hover:bg-white disabled:opacity-50",
                micError && micError !== "enum-failed" && "border-rose-200 text-rose-700 bg-rose-50"
              )}
              disabled={!!micError && micError !== "enum-failed"}
            >
              <Mic size={14} strokeWidth={2.2} />
              <span className="max-w-[120px] truncate">{micLabel || "Microphone"}</span>
              <ChevronDown size={14} className="text-tp-slate-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="max-w-[280px] border-tp-slate-200 bg-white p-1 shadow-md">
            <DropdownMenuLabel className="px-2 py-1.5 text-[12px] font-semibold text-tp-slate-500">
              Select Microphone
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-tp-slate-200" />
            {audioInputs.length === 0 ? (
              <div className="px-2 py-2 text-[12px] text-tp-slate-500">No devices found</div>
            ) : (
              audioInputs.map((d) => (
                <DropdownMenuItem
                  key={d.deviceId}
                  className={MENU_ITEM_TP}
                  onClick={() => setSelectedDeviceId(d.deviceId)}
                >
                  <span className="truncate">{d.label || `Microphone ${d.deviceId.slice(0, 6)}…`}</span>
                  {d.deviceId === selectedDeviceId && <Check size={14} className="ml-auto shrink-0 text-tp-slate-600" />}
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[170px] w-full overflow-hidden"
        aria-hidden
      >
        <div className="absolute inset-x-0 top-0 w-full translate-y-[8%] opacity-[0.92]">
          <VoiceRxBlobVisualizer
            stream={stream}
            paused={muted}
            height={300}
            ambient
            className="w-full opacity-100"
          />
        </div>
        {/* Soften blob into white footer — avoids a hard edge */}
        <div
          className="absolute inset-x-0 top-0 h-[72%] bg-gradient-to-t from-transparent via-white/25 to-white"
          aria-hidden
        />
      </div>

      <div className="relative z-[2] flex flex-col gap-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[100px] border border-tp-slate-200/90 bg-white/85 text-rose-600 shadow-sm backdrop-blur-sm transition hover:border-tp-slate-300 hover:bg-white hover:text-rose-700"
              aria-label="Cancel recording"
              title="End recording"
            >
              <X size={17} strokeWidth={2.4} />
            </button>

            {/* Pause/Resume button instead of mute/unmute */}
            <button
              type="button"
              onClick={() => setMuted((m) => !m)}
              disabled={!stream || !!micError}
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-[100px] border border-tp-slate-200/90 bg-white/90 shadow-sm backdrop-blur-sm transition-colors hover:bg-tp-slate-50 disabled:cursor-not-allowed disabled:opacity-50",
                muted && "text-amber-600 border-amber-300 bg-amber-50",
                !muted && stream && !micError && "text-tp-blue-600",
                !muted && (!stream || micError) && "text-tp-slate-600"
              )}
              aria-label={muted ? "Resume recording" : "Pause recording"}
              title={muted ? "Resume" : "Pause"}
            >
              {muted ? <Play size={17} strokeWidth={2.4} className="ml-0.5" /> : <Pause size={17} strokeWidth={2.4} />}
            </button>
          </div>

          <VoiceRxSiriWaveform stream={stream} paused={muted} className="min-w-0 flex-1" />

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onSubmit}
              className="flex h-10 shrink-0 items-center gap-2 rounded-[100px] border border-tp-blue-500 bg-tp-blue-600 px-5 shadow-sm transition hover:bg-tp-blue-700 active:scale-[0.98]"
              aria-label="Submit recording"
              title="Submit"
            >
              <Check className="text-white" size={17} strokeWidth={2.75} aria-hidden />
              <span className="text-[14px] font-semibold tracking-tight text-white">Submit</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center gap-0 pb-1">
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center">
            <span className="relative inline-flex h-2 w-2 shrink-0">
              {isLive ? (
                <>
                  <span className="absolute inset-0 animate-ping rounded-full bg-tp-violet-400/45" />
                  <span className="relative h-2 w-2 rounded-full bg-tp-violet-600 shadow-[0_0_0_3px_rgba(103,58,172,0.22)]" />
                </>
              ) : (
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    muted ? "bg-amber-500" : micError ? "bg-rose-400" : "bg-tp-amber-400",
                  )}
                />
              )}
            </span>
            <span
              className={cn(
                "text-[14px] font-medium leading-tight",
                micError && micError !== "enum-failed"
                  ? "text-rose-700 drop-shadow-sm"
                  : muted
                    ? "text-amber-900/90 drop-shadow-sm"
                    : isLive
                      ? "font-semibold text-tp-slate-800"
                      : "text-tp-slate-700",
              )}
            >
              {statusText}
            </span>
            <span
              className={cn(
                "text-[14px] font-semibold tabular-nums",
                isLive && !micError && !muted ? "text-tp-slate-500" : "text-tp-slate-500",
              )}
            >
              {mm}:{ss}
            </span>
          </div>
        </div>
      </div>

      <NetSpeedChip className="pointer-events-none absolute bottom-1.5 right-2 z-[3] opacity-75" />
    </div>
  )
}
