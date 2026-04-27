"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { ChevronDown, Check, MicOff, WifiOff, Mic, AlertCircle } from "lucide-react"

import { VoiceRxSiriWaveform } from "@/components/voicerx/VoiceRxSiriWaveform"
import { useNetConnection } from "@/components/voicerx/use-net-connection"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { TPConfirmDialog } from "@/components/tp-ui/tp-confirm-dialog"
import { useRxPadSync } from "@/components/tp-rxpad/rxpad-sync-context"
import { cn } from "@/lib/utils"
import { playVoiceRxErrorSound, playVoiceRxStartSound } from "@/components/voicerx/voice-audio-utils"

// Minimal ambient typings for Web Speech API (not in lib.dom.d.ts).
type SpeechRecognitionEventLike = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>
}
type SpeechRecognitionLike = {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((e: SpeechRecognitionEventLike) => void) | null
  onerror: ((e: unknown) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}
interface BrowserWithSpeech extends Window {
  SpeechRecognition?: new () => SpeechRecognitionLike
  webkitSpeechRecognition?: new () => SpeechRecognitionLike
}

function AnimatedTranscriptPreview({
  text,
  className,
}: {
  text: string
  className?: string
}) {
  const tokens = useMemo(() => (text ? text.split(/(\s+)/) : []), [text])
  const prevVisibleCountRef = useRef(0)
  let visibleIndex = -1
  const prevVisible = prevVisibleCountRef.current

  const rendered = tokens.map((token, index) => {
    if (/^\s+$/.test(token)) return <span key={index}>{token}</span>

    visibleIndex += 1
    const isNew = visibleIndex >= prevVisible
    const stagger = Math.min((visibleIndex - prevVisible) * 26, 220)

    return (
      <span
        key={index}
        className="vrx-word"
        style={
          isNew
            ? { animation: `vrxWordReveal 420ms cubic-bezier(0.22,1,0.36,1) ${stagger}ms both` }
            : undefined
        }
      >
        {token}
      </span>
    )
  })

  useEffect(() => {
    prevVisibleCountRef.current = visibleIndex + 1
  })

  return <p className={className}>{rendered}</p>
}

/**
 * Inline per-Rx-module / per-sidebar-section voice recorder.
 *
 * Two-column layout inside a lighter AI-gradient rectangle:
 *
 *   ┌── gradient rectangle ───────────────────────────────────────────┐
 *   │  ┌ transcript (left ~60%) ──────┐  ┌ actions (right ~40%) ────┐ │
 *   │  │  rolling 4-5 line transcript │  │  [wave reactive strip]   │ │
 *   │  │  with top-fade mask          │  │  [✕] [🎤 ⌄] [✓ Submit]   │ │
 *   │  │  OR illustrated error state  │  │  · Listening · 00:04 ·    │ │
 *   │  └───────────────────────────────┘  └──────────────────────────┘ │
 *   └──────────────────────────────────────────────────────────────────┘
 *
 * Error states (permission denied, offline, slow connection) replace
 * the transcript zone with a Dr. Agent-style illustrated block: chunky
 * icon, concise title, short secondary explainer, and a retry CTA when
 * applicable. Submit + mic actions on the right are disabled under any
 * critical block so the user can't kick off more recording attempts.
 */
export interface VoiceRxModuleRecorderProps {
  sectionLabel: string
  onCancel: () => void
  onSubmit: (transcript: string) => void
  /** Scripted override for the final transcript (tests / POC). */
  transcript?: string
  /** Applied to the outer rectangle (e.g. rounded-b-[16px]). */
  radiusClassName?: string
  /**
   * Layout variant.
   * - `row` (default): two-column horizontal split — actions on the
   *   left, transcript / empty-state on the right. Used inside Rx
   *   modules where the card has plenty of horizontal space.
   * - `stack`: single-column vertical stack matching the Dr. Agent
   *   voice active panel — transcript fills the top, CTAs underneath,
   *   listening pill at the bottom edge. Used inside sidebar
   *   historical panels where the container is narrow + tall.
   */
  variant?: "row" | "stack"
  /** Fill the parent container's full height (useful in overlay uses). */
  fillHeight?: boolean
}

type Device = { deviceId: string; label: string }

function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(total / 60).toString().padStart(2, "0")
  const s = (total % 60).toString().padStart(2, "0")
  return `${m}:${s}`
}

export function VoiceRxModuleRecorder({
  sectionLabel,
  onCancel,
  onSubmit,
  transcript: scriptedTranscript,
  radiusClassName = "rounded-b-[16px]",
  variant = "row",
  fillHeight = false,
}: VoiceRxModuleRecorderProps) {
  const [manualMute, setManualMute] = useState(false)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [isCompactLayout, setIsCompactLayout] = useState(variant === "stack")
  const [devicePopoverOpen, setDevicePopoverOpen] = useState(false)
  const [devices, setDevices] = useState<Device[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(undefined)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [micError, setMicError] = useState<string | null>(null)
  const [liveTranscript, setLiveTranscript] = useState("")
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false)
  const [micRetryKey, setMicRetryKey] = useState(0)
  const startRef = useRef<number>(Date.now())
  const containerRef = useRef<HTMLDivElement>(null)
  const net = useNetConnection()
  const { setActiveVoiceModule } = useRxPadSync()

  useEffect(() => {
    setActiveVoiceModule(sectionLabel)
    return () => setActiveVoiceModule(null)
  }, [sectionLabel, setActiveVoiceModule])

  useEffect(() => {
    playVoiceRxStartSound()
  }, [])

  useEffect(() => {
    if (variant === "stack") {
      setIsCompactLayout(true)
      return
    }
    const node = containerRef.current
    if (!node || typeof ResizeObserver === "undefined") return

    const update = () => {
      setIsCompactLayout(node.getBoundingClientRect().width < 560)
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(node)
    return () => observer.disconnect()
  }, [variant])

  // ── Mic stream ────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setMicError("Microphone not supported in this browser")
      return
    }
    let cancelled = false
    let acquired: MediaStream | null = null
    ;(async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          audio: selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : true,
        })
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop())
          return
        }
        acquired = s
        setStream(s)
        setMicError(null)
        try {
          const all = await navigator.mediaDevices.enumerateDevices()
          if (!cancelled) {
            setDevices(
              all
                .filter((d) => d.kind === "audioinput")
                .map((d) => ({
                  deviceId: d.deviceId,
                  label: d.label || `Microphone (${(d.deviceId || "default").slice(0, 6)})`,
                })),
            )
          }
        } catch { /* ignore */ }
      } catch (e) {
        if (!cancelled) setMicError(e instanceof Error ? e.message : "Microphone access denied")
      }
    })()
    return () => {
      cancelled = true
      acquired?.getTracks().forEach((t) => t.stop())
      setStream(null)
    }
  }, [selectedDeviceId, micRetryKey])

  useEffect(() => {
    if (!stream) return
    stream.getAudioTracks().forEach((t) => { t.enabled = !manualMute })
  }, [manualMute, stream])

  // ── Web Speech live transcript ────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return
    const w = window as BrowserWithSpeech
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition
    if (!SR) return
    const recog = new SR()
    recog.continuous = true
    recog.interimResults = true
    recog.lang = "en-US"
    recog.onresult = (e) => {
      let text = ""
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript + " "
      setLiveTranscript(text.trim())
    }
    recog.onerror = () => { /* swallow transient no-speech */ }
    recog.onend = () => { try { recog.start() } catch { /* ignore */ } }
    try { recog.start() } catch { /* ignore */ }
    return () => { recog.onend = null; try { recog.stop() } catch { /* ignore */ } }
  }, [])

  const networkPaused = !net.online || net.slowConnection
  const hasMicError = Boolean(micError)
  const criticalBlock = hasMicError || networkPaused
  const isPaused = manualMute || criticalBlock
  const isListening = !isPaused

  useEffect(() => {
    if (isPaused) return
    const tick = () => setElapsedMs(Date.now() - startRef.current)
    const id = window.setInterval(tick, 500)
    return () => window.clearInterval(id)
  }, [isPaused])

  useEffect(() => {
    if (!isPaused) startRef.current = Date.now() - elapsedMs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaused])

  const displayTranscript = scriptedTranscript && scriptedTranscript.length > 0
    ? scriptedTranscript
    : liveTranscript
  const hasTranscript = displayTranscript.trim().length > 0
  const transcriptScrollRef = useRef<HTMLDivElement>(null)
  const compactControls = variant === "stack" || isCompactLayout

  useEffect(() => {
    const node = transcriptScrollRef.current
    if (!node) return
    requestAnimationFrame(() => {
      node.scrollTo({ top: node.scrollHeight, behavior: "smooth" })
    })
  }, [displayTranscript])

  // ── Critical-block empty state, mirroring the Dr. Agent panel ──────────
  const block = useMemo<null | {
    kind: "offline" | "slow" | "mic"
    icon: React.ReactNode
    title: string
    description: string
    canRetry: boolean
  }>(() => {
    if (!net.online) return {
      kind: "offline",
      icon: <WifiOff size={32} strokeWidth={2.2} absoluteStrokeWidth />,
      title: "You\u2019re offline",
      description: "Recording is paused until you\u2019re back online. Your transcript so far is safe — it resumes automatically.",
      canRetry: false,
    }
    if (net.slowConnection) return {
      kind: "slow",
      icon: <AlertCircle size={32} strokeWidth={2.2} absoluteStrokeWidth />,
      title: "Connection unstable",
      description: "We\u2019ve paused recording because the connection is slow. It will resume automatically when the network stabilises.",
      canRetry: false,
    }
    if (hasMicError) return {
      kind: "mic",
      icon: <MicOff size={32} strokeWidth={2.2} absoluteStrokeWidth />,
      title: "Microphone unavailable",
      description: micError || "Allow microphone access in your browser to start dictation. Your transcript so far stays safe.",
      canRetry: true,
    }
    return null
  }, [net.online, net.slowConnection, hasMicError, micError])

  const lastErrorToneRef = useRef<string | null>(null)
  useEffect(() => {
    const errorKey = block ? `${block.kind}:${block.title}` : null
    if (!errorKey) {
      lastErrorToneRef.current = null
      return
    }
    if (lastErrorToneRef.current === errorKey) return
    lastErrorToneRef.current = errorKey
    playVoiceRxErrorSound()
  }, [block])

  // Status pill label — short. Full explanation already lives in the
  // empty-state block on the left, so the pill only needs a terse cue.
  const statusLabel = hasMicError
    ? "Mic error"
    : !net.online
      ? "Offline"
      : net.slowConnection
        ? "On hold"
        : manualMute
          ? "Paused"
          : "Listening"

  // ── Shared render pieces (used by both `row` and `stack` variants) ────
  const waveStrip = (
    // 60px high so the Siri wave has room to warble without clipping
    // top/bottom when the clinician speaks loudly. Used by both the row
    // variant (Rx modules) and the stack variant (sidebar overlay).
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-[10px]",
        compactControls ? "h-[56px] max-w-[300px]" : "h-[60px] max-w-[320px]",
      )}
    >
      <VoiceRxSiriWaveform
        className="absolute inset-0 h-full w-full"
        stream={stream}
        paused={isPaused}
      />
      {isPaused ? <div className="absolute inset-0 backdrop-blur-[2px]" /> : null}
    </div>
  )

  const transcriptBlock = block ? (
    // Error empty-state. Two shapes:
    //  • ROW variant   — compact horizontal (40px icon, title + retry
    //                    inline on the right) so the card can stay
    //                    near its 80px minimum height.
    //  • STACK variant — full empty-state illustration: large centered
    //                    icon in a soft halo, bold title, 12px
    //                    description line, outlined blue retry CTA.
    //                    Proper "there's nothing here yet" feel.
    variant === "stack" ? (
      <div className="flex flex-col items-center text-center" role="status" aria-live="polite">
        {/* Empty-state mark — soft slate circle, slate-400 glyph inside.
            Heavier gray-on-gray treatment (no violet ring) so it reads
            as an illustration-quiet background element, not a control. */}
        <div
          aria-hidden
          className="relative mb-[14px] inline-flex h-[68px] w-[68px] items-center justify-center rounded-full"
          style={{ background: "rgba(148,163,184,0.18)" }}
        >
          <span
            className="absolute inset-[10px] rounded-full"
            style={{ background: "rgba(148,163,184,0.22)" }}
          />
          <span className="relative text-tp-slate-400">
            {block.icon}
          </span>
        </div>
        <h3 className="text-[14px] font-semibold tracking-[-0.01em] text-tp-slate-700">
          {block.title}
        </h3>
        <p className="mt-[6px] max-w-[280px] text-[12px] leading-[1.55] text-tp-slate-500">
          {block.description}
        </p>
        {block.canRetry ? (
          <button
            type="button"
            onClick={() => setMicRetryKey((k) => k + 1)}
            className="mt-[14px] inline-flex h-[34px] items-center gap-[6px] rounded-[8px] border bg-transparent px-[14px] text-[12.5px] font-semibold transition-colors active:scale-[0.98] hover:bg-tp-blue-50/40"
            style={{ color: "var(--tp-blue-500)", borderColor: "var(--tp-blue-500)" }}
          >
            <Mic size={13} strokeWidth={2.2} aria-hidden />
            Allow microphone access
          </button>
        ) : null}
      </div>
    ) : (
      // Row variant — vertical stack (icon → title → CTA). Larger icon
      // centered with minimal padding so the empty state reads like a
      // proper illustration, not a squeezed chip.
      <div className="flex flex-col items-center gap-[6px] text-center" role="status" aria-live="polite">
        <div
          aria-hidden
          className="relative inline-flex h-[56px] w-[56px] items-center justify-center rounded-full"
          style={{ background: "rgba(148,163,184,0.16)" }}
        >
          <span
            className="absolute inset-[8px] rounded-full"
            style={{ background: "rgba(148,163,184,0.20)" }}
          />
          <span className="relative text-tp-slate-400 [&>svg]:h-[28px] [&>svg]:w-[28px]">
            {block.icon}
          </span>
        </div>
        <h3 className="text-[12.5px] font-semibold tracking-[-0.01em] text-tp-slate-700">
          {block.title}
        </h3>
        {block.canRetry ? (
          <button
            type="button"
            onClick={() => setMicRetryKey((k) => k + 1)}
            className="inline-flex h-[28px] items-center gap-[5px] rounded-[6px] border bg-transparent px-[10px] text-[11.5px] font-semibold transition-colors active:scale-[0.98] hover:bg-tp-blue-50/40"
            style={{ color: "var(--tp-blue-500)", borderColor: "var(--tp-blue-500)" }}
          >
            <Mic size={11} strokeWidth={2.2} aria-hidden />
            Allow microphone access
          </button>
        ) : (
          <p className="max-w-[240px] text-[11px] leading-[15px] text-tp-slate-500">
            {block.description}
          </p>
        )}
      </div>
    )
  ) : (
    <div className="flex w-full items-center justify-center text-center">
      <div
        ref={transcriptScrollRef}
        className={cn(
          "w-full overflow-y-auto px-1",
          variant === "stack" ? "max-h-[176px]" : "max-h-[108px]",
        )}
        style={{ scrollbarWidth: "none" }}
      >
        {hasTranscript ? (
          <AnimatedTranscriptPreview
            text={displayTranscript}
            className={cn(
              "whitespace-pre-wrap break-words text-center tracking-[-0.01em] text-tp-slate-400",
              variant === "stack"
                ? "text-[15px] font-medium leading-[1.8]"
                : "text-[14px] font-medium leading-[1.72]",
            )}
          />
        ) : (
          <p
            className={cn(
              "text-center tracking-[-0.01em] text-tp-slate-400/70",
              variant === "stack"
                ? "text-[14px] font-normal leading-[1.65]"
                : "text-[13px] font-normal leading-[1.55]",
            )}
          >
            Start speaking, you&apos;ll see the transcript here
          </p>
        )}
      </div>
    </div>
  )

  const ctaRow = (
    <div className={cn("flex items-center justify-center", compactControls ? "gap-[10px]" : "gap-[14px]")}>
      <button
        type="button"
        onClick={() => setConfirmCloseOpen(true)}
        aria-label="Cancel dictation"
        className={cn(
          "vrx-lg-btn vrx-close-btn relative flex items-center justify-center transition-transform active:scale-[0.94]",
          compactControls ? "h-[40px] w-[40px] rounded-[11px]" : "h-[44px] w-[44px] rounded-[12px]",
        )}
      >
        <span className="vrx-lg-surface" aria-hidden />
        <span className="vrx-lg-sheen" aria-hidden />
        <svg
          width={compactControls ? 16 : 18}
          height={compactControls ? 16 : 18}
          viewBox="0 0 24 24"
          fill="none"
          className="relative text-[#DC2626]"
        >
          <path d="M18 6L6 18" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 6L18 18" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <span className={cn("vrx-cta-divider", compactControls && "h-[30px]")} aria-hidden />

      <div
        className={cn(
          "vrx-lg-btn relative flex items-stretch rounded-[12px] transition-opacity",
          manualMute && "vrx-mic-muted",
          criticalBlock && "opacity-45 pointer-events-none",
        )}
      >
        <span className="vrx-lg-surface" aria-hidden />
        <span className="vrx-lg-sheen" aria-hidden />
        <button
          type="button"
          onClick={() => setManualMute((v) => !v)}
          disabled={criticalBlock}
          className={cn(
            "relative flex items-center justify-center text-tp-slate-700 transition-transform active:scale-[0.94] disabled:cursor-not-allowed disabled:opacity-60",
            compactControls ? "h-[40px] w-[40px]" : "h-[44px] w-[44px]",
          )}
          style={{ borderRadius: compactControls ? "11px 0 0 11px" : "12px 0 0 12px" }}
          aria-label={manualMute ? "Unmute microphone" : "Mute microphone"}
          aria-pressed={manualMute}
        >
          <svg
            width={compactControls ? 16 : 18}
            height={compactControls ? 16 : 18}
            viewBox="0 0 24 24"
            fill="none"
            className="relative"
          >
            <path d="M7.99951 10.02V11.5C7.99951 13.71 9.78951 15.5 11.9995 15.5C14.2095 15.5 15.9995 13.71 15.9995 11.5V6C15.9995 3.79 14.2095 2 11.9995 2C9.78951 2 7.99951 3.79 7.99951 6" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4.34961 9.65039V11.3504C4.34961 15.5704 7.77961 19.0004 11.9996 19.0004C16.2196 19.0004 19.6496 15.5704 19.6496 11.3504V9.65039" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M11.9995 19V22" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
            {manualMute && <path d="M3 21L21 3" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />}
          </svg>
        </button>
        <div className="vrx-lg-divider" aria-hidden />
        <Popover open={devicePopoverOpen} onOpenChange={setDevicePopoverOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={criticalBlock}
              className={cn(
                "relative flex items-center justify-center transition-transform active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-60",
                compactControls ? "h-[40px] w-[24px]" : "h-[44px] w-[26px]",
                manualMute ? "text-[#D97706]/80" : "text-tp-slate-700 hover:text-tp-slate-900",
              )}
              style={{ borderRadius: compactControls ? "0 11px 11px 0" : "0 12px 12px 0" }}
              aria-label="Choose microphone"
            >
              <ChevronDown
                size={compactControls ? 13 : 14}
                strokeWidth={2.2}
                className={cn("relative transition-transform duration-200", devicePopoverOpen && "rotate-180")}
              />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="center" side="top" sideOffset={10}
            data-voice-allow
            className="w-[240px] overflow-hidden rounded-2xl border border-white/60 bg-white/92 p-1.5 shadow-[0_24px_60px_-12px_rgba(31,38,135,0.28),0_8px_24px_-8px_rgba(15,23,42,0.12)] backdrop-blur-3xl"
          >
            <div className="flex items-center gap-2 px-3 pb-1.5 pt-2 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-tp-slate-400">
              Microphone
            </div>
            {devices.length === 0 ? (
              <div className="px-3 py-3 text-[13px] text-tp-slate-500">
                {micError ? micError : "No input devices detected"}
              </div>
            ) : (
              devices.map((d, i) => {
                const isSelected = selectedDeviceId ? selectedDeviceId === d.deviceId : i === 0
                return (
                  <button
                    key={d.deviceId || i}
                    type="button"
                    onClick={() => { setSelectedDeviceId(d.deviceId); setDevicePopoverOpen(false) }}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-[13px] transition-colors",
                      isSelected
                        ? "bg-gradient-to-r from-violet-50/80 to-fuchsia-50/80 font-semibold text-tp-violet-700"
                        : "text-tp-slate-700 hover:bg-tp-slate-100/80",
                    )}
                  >
                    <span className="truncate">{d.label}</span>
                    {isSelected && <Check size={14} className="shrink-0 text-tp-violet-600" />}
                  </button>
                )
              })
            )}
          </PopoverContent>
        </Popover>
      </div>

      <span className={cn("vrx-cta-divider", compactControls && "h-[30px]")} aria-hidden />

      <button
        type="button"
        onClick={() => onSubmit(displayTranscript)}
        disabled={criticalBlock}
        aria-label="Submit dictation"
        className={cn(
          "relative flex items-center overflow-hidden text-white transition-transform",
          compactControls
            ? "h-[40px] gap-[6px] rounded-[11px] pl-[12px] pr-[14px]"
            : "h-[44px] gap-[7px] rounded-[12px] pl-[16px] pr-[18px]",
          !criticalBlock ? "hover:scale-[1.03] active:scale-[0.97]" : "cursor-not-allowed opacity-40 saturate-[0.85]",
        )}
        style={{ background: "linear-gradient(135deg, #D565EA 0%, #673AAC 55%, #1A1994 100%)" }}
      >
        <svg
          width={compactControls ? 13 : 14}
          height={compactControls ? 13 : 14}
          viewBox="0 0 24 24"
          fill="none"
          className="relative"
        >
          <path d="M5 13l4 4L19 7" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className={cn("relative font-semibold", compactControls ? "text-[12px]" : "text-[13px]")}>Submit</span>
      </button>
    </div>
  )

  return (
    <div
      ref={containerRef}
      data-voice-allow
      className={cn(
        "relative overflow-hidden",
        fillHeight && "h-full",
        radiusClassName,
      )}
      // Outer background:
      //   ROW variant   — Dr. Agent brand textured AI gradient washed to
      //                   ~10% visibility by a near-opaque white overlay,
      //                   so the card reads white with a faint violet tint.
      //   STACK variant — light slate-50 tint (not pure white) so the
      //                   overlay is clearly distinguishable from the
      //                   white sidebar surface behind it. Top-fade mask
      //                   dissolves the top edge into the scrolling
      //                   cards above.
      style={{
        background:
          variant === "stack"
            ? "#F4F4F8"
            : "linear-gradient(rgba(255,255,255,0.84), rgba(255,255,255,0.84)), url(\"/icons/dr-agent/agent-bg.svg\") center/cover no-repeat",
        WebkitMaskImage:
          variant === "stack"
            ? "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 22%, rgba(0,0,0,1) 100%)"
            : undefined,
        maskImage:
          variant === "stack"
            ? "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 22%, rgba(0,0,0,1) 100%)"
            : undefined,
      }}
    >
      {variant === "stack" ? (
        // ── STACK variant — used inside sidebar historical panels.
        //    Transcript fills the top, wave + CTAs below, pill at the
        //    bottom edge. Takes the whole container height so the
        //    transcript can stretch like Dr. Agent's voice active mode.
        <>
          {/* Wobbling violet blob — small, short, low-density. Sits
              centered near the bottom of the stack variant behind the
              listening pill. Clipped inside the outer rectangle. */}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-[10px] z-0 flex justify-center">
            <div className="tp-voice-blob h-[56px] w-[204px]" />
          </div>
          <div
            className={cn(
              "relative z-10 flex flex-col px-4 pt-6 pb-[48px]",
              fillHeight && "h-full",
            )}
          >
            {/* Transcript / empty-state — fills the upper portion. */}
            <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden">
              <div className="w-full max-w-[340px]">
                {transcriptBlock}
              </div>
            </div>
            {/* Wave strip — its own breathing room. */}
            <div className="mt-[20px] flex justify-center">{waveStrip}</div>
            {/* CTAs — clear separation from the wave above and the
                Listening pill that's pinned at the bottom. */}
            <div className="mt-[18px] flex justify-center">{ctaRow}</div>
          </div>
        </>
      ) : (
        // ── ROW variant — used inside Rx modules (wide horizontal card).
        //    Left: wave + CTAs. Right: transcript / empty-state.
        <>
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-[10px] z-0 flex justify-center">
          <div className="tp-voice-blob h-[46px] w-[176px]" />
        </div>
        <div className="relative z-10 flex min-h-[112px] items-stretch gap-0 pb-[30px]">
        {/* LEFT: wave + CTA cluster. Gap bumped (6 → 14) so the CTAs
            sit a comfortable distance below the wave, and an extra
            bottom reservation on the outer flex row (`pb-[30px]`) keeps
            the CTAs clear of the pill on narrow widths. */}
        <div className="relative flex min-w-0 flex-1 flex-col items-center justify-center gap-[14px] px-4 py-3">
          {waveStrip}
          {ctaRow}
        </div>
        {/* Vertical divider — faint, not a cut. */}
        <div aria-hidden className="w-px bg-gradient-to-b from-transparent via-tp-slate-200/60 to-transparent" />
        {/* RIGHT: transcript / empty-state. */}
        <div className="relative flex min-w-0 flex-1 flex-col items-center justify-center px-4 py-2 text-center">
          {transcriptBlock}
        </div>
      </div>
      </>
      )}

      {/* ── Listening pill — horizontally centered across the WHOLE
             recorder with flat bottom corners. Tab welded to the base. ── */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex justify-center">
            <div
              className={cn(
                "inline-flex items-center gap-[7px] rounded-t-[12px] rounded-b-none pl-[12px] pr-[14px] pt-[6px] pb-[8px] text-[12px] font-medium tracking-[-0.05px] tabular-nums backdrop-blur-[10px] transition-colors",
                hasMicError
                  ? "bg-tp-error-50/85 text-tp-error-600"
                  : !net.online || net.slowConnection
                    ? "bg-amber-50/85 text-amber-700"
                    : manualMute
                      ? "bg-white/70 text-amber-700"
                      : "bg-white/75 text-tp-slate-600",
              )}
              role={hasMicError ? "alert" : "status"}
              aria-live="polite"
            >
              {hasMicError ? (
                <AlertCircle size={12} strokeWidth={2.4} aria-hidden />
              ) : isListening ? (
                <span className="relative inline-flex h-[9px] w-[9px] items-center justify-center">
                  <span className="absolute inset-0 rounded-full bg-rose-400" />
                  <span className="absolute inset-0 rounded-full bg-rose-400/55" style={{ animation: "vrxRecRing 1.8s ease-out infinite" }} />
                </span>
              ) : (
                <span className="inline-block h-[7px] w-[7px] rounded-full bg-current opacity-70" />
              )}
              <span>
                {statusLabel} · {sectionLabel}
                {!criticalBlock && !manualMute && elapsedMs > 0 && (
                  <span className="ml-[4px] font-normal opacity-60">
                    ({formatElapsed(elapsedMs)})
                  </span>
                )}
              </span>
            </div>
      </div>

      <TPConfirmDialog
        open={confirmCloseOpen}
        onOpenChange={setConfirmCloseOpen}
        title="Close this voice consultation?"
        warning="Are you sure you want to close this voice Rx? If you close it, no data will be stored."
        secondaryLabel="Keep recording"
        onSecondary={() => setConfirmCloseOpen(false)}
        primaryLabel="Close and discard"
        primaryTone="destructive"
        onPrimary={() => { setConfirmCloseOpen(false); onCancel() }}
      />
    </div>
  )
}
