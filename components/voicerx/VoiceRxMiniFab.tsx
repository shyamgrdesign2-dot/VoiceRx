"use client"

import React, { useEffect, useId, useLayoutEffect, useRef } from "react"

import { cn } from "@/lib/utils"

export type VoiceRxMiniFabBannerTone = "warn" | "offline" | "error"

export interface VoiceRxMiniFabProps {
  stream: MediaStream | null
  paused: boolean
  levelRef: React.MutableRefObject<number>
  elapsedLabel: string
  statusLabel: string
  manualMute: boolean
  isAwaitingResponse: boolean
  canSubmit: boolean
  banner: { tone: VoiceRxMiniFabBannerTone; icon: React.ReactNode; message: string } | null
  onToggleMute: () => void
  onSubmit: () => void
  onExpand: () => void
  onRequestCancel: () => void
}

/** Reference FAB path — 430×115 viewBox, organic dome with indents for mic/submit. */
const FAB_PATH =
  "M395.24 23.6125C381.35 31.5666 366.81 41.5232 360.83 55.4195C352.63 74.3548 341.13 86.7689 319.47 86.769H110.53C88.87 86.7689 77.37 74.3548 69.17 55.4195C63.19 41.5232 48.62 31.5666 34.73 23.6125L28.43 20H401.32L395.24 23.6125Z"

/** Simple tick (checkmark) icon with TP AI gradient stroke. */
function TickIcon({ size = 24 }: { size?: number; gradientId?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      {/* Solid TP-green checkmark — replaces the earlier violet-gradient
          stroke. Reads as a clear success / submit affordance. */}
      <path
        d="M20.46 6.17969L8.82003 17.8197L3.53003 12.5297"
        stroke="#10B981"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Iconsax-style mic icon — matches the reference FAB's orange mic glyph.
 *  When `muted` is true, overlays a diagonal slash so the state is
 *  immediately readable ("unmute" glyph pattern). */
function VoiceMicIcon({ size = 24, color = "#000000", muted = false }: { size?: number; color?: string; muted?: boolean }) {
  return (
    <svg fill="none" height={size} viewBox="0 0 24 24" width={size} xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M19.1199 9.12035C18.7299 9.12035 18.4199 9.43035 18.4199 9.82035V11.4004C18.4199 14.9404 15.5399 17.8204 11.9999 17.8204C8.45993 17.8204 5.57993 14.9404 5.57993 11.4004V9.81035C5.57993 9.42035 5.26993 9.11035 4.87993 9.11035C4.48993 9.11035 4.17993 9.42035 4.17993 9.81035V11.3904C4.17993 15.4604 7.30993 18.8104 11.2999 19.1704V21.3004C11.2999 21.6904 11.6099 22.0004 11.9999 22.0004C12.3899 22.0004 12.6999 21.6904 12.6999 21.3004V19.1704C16.6799 18.8204 19.8199 15.4604 19.8199 11.3904V9.81035C19.8099 9.43035 19.4999 9.12035 19.1199 9.12035Z"
        fill={color}
      />
      <path
        d="M12.0001 2C9.56008 2 7.58008 3.98 7.58008 6.42V11.54C7.58008 13.98 9.56008 15.96 12.0001 15.96C14.4401 15.96 16.4201 13.98 16.4201 11.54V6.42C16.4201 3.98 14.4401 2 12.0001 2Z"
        fill={color}
      />
      {muted && (
        <>
          {/* White under-halo makes the slash read clearly over the mic body. */}
          <path
            d="M3 21L21 3"
            stroke="#ffffff"
            strokeWidth={3.2}
            strokeLinecap="round"
          />
          <path
            d="M3 21L21 3"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  )
}

/**
 * Live waveform — crisp canvas bar equalizer.
 * Uses Web Audio analyser with smoothing; draws in CSS pixel coords via setTransform(dpr).
 * When no stream, falls back to a gentle idle sine so the FAB is never static.
 */
function LiveWaveform({
  stream,
  active,
  height = 28,
  barColor = "#FFFFFF",
  barWidth = 4,
  barGap = 2,
  barHeight = 6,
  fadeEdges = true,
  targetBarCount,
}: {
  stream: MediaStream | null
  active: boolean
  height?: number
  barColor?: string
  barWidth?: number
  barGap?: number
  barHeight?: number
  fadeEdges?: boolean
  targetBarCount?: number
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const frameRef = useRef<number | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const sizeRef = useRef({ w: 0, h: 0 })

  // Size the canvas to its CSS box; track CSS-pixel size for drawing.
  useLayoutEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const updateSize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.max(1, Math.floor(rect.width * dpr))
      canvas.height = Math.max(1, Math.floor(rect.height * dpr))
      sizeRef.current = { w: rect.width, h: rect.height }
    }
    updateSize()
    const obs = new ResizeObserver(updateSize)
    obs.observe(canvas)
    return () => obs.disconnect()
  }, [])

  // Wire analyser to the provided MediaStream.
  useEffect(() => {
    if (!stream) {
      analyserRef.current = null
      sourceRef.current = null
      if (audioContextRef.current) { void audioContextRef.current.close(); audioContextRef.current = null }
      return
    }
    try {
      const ctx = new window.AudioContext()
      const analyser = ctx.createAnalyser()
      const src = ctx.createMediaStreamSource(stream)
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.76
      src.connect(analyser)
      audioContextRef.current = ctx
      analyserRef.current = analyser
      sourceRef.current = src
      return () => {
        src.disconnect(); analyser.disconnect()
        analyserRef.current = null; sourceRef.current = null
        void ctx.close()
        if (audioContextRef.current === ctx) audioContextRef.current = null
      }
    } catch { /* ignore */ }
  }, [stream])

  // Draw loop.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dataArray = new Uint8Array(128)

    const draw = () => {
      const context = canvas.getContext("2d")
      if (!context) return
      const dpr = window.devicePixelRatio || 1
      const { w: cssW, h: cssH } = sizeRef.current
      if (cssW <= 0 || cssH <= 0) {
        frameRef.current = window.requestAnimationFrame(draw)
        return
      }

      // Draw in CSS pixel space for crisp bars regardless of DPR.
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      context.clearRect(0, 0, cssW, cssH)

      const centerY = cssH / 2
      const span = barWidth + barGap
      const autoBarCount = Math.max(1, Math.floor((cssW + barGap) / span))
      const barCount = targetBarCount
        ? Math.max(1, Math.min(targetBarCount, autoBarCount))
        : autoBarCount
      const totalW = barCount * span - barGap
      const offsetX = (cssW - totalW) / 2
      const analyser = analyserRef.current

      let levels: number[] = []
      if (active && analyser) {
        analyser.getByteFrequencyData(dataArray)
        levels = Array.from({ length: barCount }, (_, i) => {
          const dist = barCount > 1 ? Math.abs(i - (barCount - 1) / 2) / ((barCount - 1) / 2) : 0
          const centerBias = 1 - dist
          const sampleIdx = Math.min(
            dataArray.length - 1,
            Math.floor((0.04 + dist * 0.32) * dataArray.length),
          )
          const raw = dataArray[sampleIdx] / 255
          return Math.min(1, raw * (0.72 + centerBias * 0.42))
        })
      } else {
        const t = performance.now() / 1000
        levels = Array.from({ length: barCount }, (_, i) => {
          const baseWave = (Math.sin(t * 2.3 + i * 0.55) + 1) / 2
          return 0.04 + baseWave * 0.05
        })
      }

      levels.forEach((level, i) => {
        const dist = barCount > 1 ? Math.abs(i - (barCount - 1) / 2) / ((barCount - 1) / 2) : 0
        const centerBias = 1 - dist
        const alpha = fadeEdges ? 1 - dist * 0.42 : 1
        const minH = Math.max(barHeight, cssH * 0.14)
        const barH = Math.max(minH, level * cssH * 0.56 + centerBias * cssH * 0.03)
        const x = offsetX + i * span
        const y = centerY - barH / 2
        context.globalAlpha = alpha
        context.fillStyle = barColor
        context.beginPath()
        context.roundRect(x, y, barWidth, barH, barWidth / 2)
        context.fill()
      })
      context.globalAlpha = 1
      frameRef.current = window.requestAnimationFrame(draw)
    }
    draw()
    return () => { if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current) }
  }, [active, barColor, barGap, barHeight, barWidth, fadeEdges])

  return <canvas ref={canvasRef} aria-hidden style={{ display: "block", width: "86px", height: "23px" }} />
}

/**
 * Voice-active FAB — reference design (430×115 dome shell, rotated 90° as a vertical rail).
 * Preserves existing contract: mic tap toggles mute, submit tap submits, body tap expands.
 *
 * Positioning: outer fixed container matches the visually-rotated bounding box so
 * the FAB sits flush with the right edge and respects bottom-inset spacing.
 */
export function VoiceRxMiniFab({
  stream,
  paused,
  elapsedLabel,
  statusLabel,
  manualMute,
  isAwaitingResponse,
  canSubmit,
  onToggleMute,
  onSubmit,
  onExpand,
}: VoiceRxMiniFabProps) {
  const uid = useId()
  const shadowId = `${uid}-shadow`
  const shellId = `${uid}-shell`

  // Shell native is 430×115 horizontal. Scale to 400×107 then rotate 90° → 107 wide × 400 tall visually.
  const SHELL_W = 346
  const SHELL_H = 100

  return (
    // Outer: the visually-rotated bounding box. Sticks to the right edge with a 28px bottom inset.
    // Clicking anywhere on the FAB (except the mic/submit buttons, which stopPropagation)
    // re-opens the Dr. Agent panel via onExpand.
    <div
      className="pointer-events-auto fixed z-[70] cursor-pointer"
      data-voice-allow
      role="button"
      tabIndex={0}
      aria-label="Expand voice consultation"
      onClick={onExpand}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onExpand() }}
      style={{
        bottom: 28,
        right: 0,
        width: SHELL_H, // visual width after rotation
        height: SHELL_W, // visual height after rotation
        animation: "vrxFabIn 360ms cubic-bezier(0.22,1,0.36,1) both",
      }}
    >
      {/* Inner: the native-size 400×107 shell, rotated 90° around its center so its
          visual box exactly fills the outer container. */}
      <div
        className="absolute"
        style={{
          left: "50%",
          top: "50%",
          width: SHELL_W,
          height: SHELL_H,
          transform: "translate(-50%, -50%) rotate(90deg)",
          transformOrigin: "center center",
        }}
      >
        {/* ── SVG background ONLY (shell path + drop-shadow). No foreignObject
              — that was the iPad breakage: iOS Safari mis-positions HTML
              inside <foreignObject> when there's a parent rotate()
              transform, which is why the mic/tick buttons were flying off
              on iPad. The HTML interior is now a native sibling overlay
              below. ────────────────────────────────────────────────── */}
        <svg
          aria-hidden
          className="block overflow-visible"
          style={{ width: SHELL_W, height: SHELL_H, position: "absolute", left: -10, top: -20, pointerEvents: "none" }}
          viewBox="0 0 430 115"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid meet"
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
              <feBlend in="SourceGraphic" in2="effect1_dropShadow" mode="normal" result="shape" />
            </filter>
            {/* Dark violet-indigo gradient — matched to the Dr. Agent
                brand square (agent-bg.svg) used in the chat bubble +
                AgentHeader brand tag. Keeps the recording MiniFab and
                the idle DrAgentFab visually indistinguishable in colour
                so they read as one product mark. No pink stop. */}
            {/* TP AI brand gradient — LEFT→RIGHT sweep across the long
                 axis of the dome. x1=28.43, x2=401.32 spans the full
                 horizontal run of the path so each third of the dome
                 picks up a distinct hue (pink → violet → indigo). */}
            <linearGradient id={shellId} x1="28.43" x2="401.32" y1="53" y2="53" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#D565EA" />
              <stop offset="0.5" stopColor="#673AAC" />
              <stop offset="1" stopColor="#1A1994" />
            </linearGradient>
          </defs>

          <g filter={`url(#${shadowId})`}>
            <path d={FAB_PATH} fill={`url(#${shellId})`} />
          </g>
        </svg>

        {/* ── Native HTML interior in VIEWBOX coordinates.
              The SVG path is drawn at 0.8046× CSS scale (uniform, from
              `preserveAspectRatio="xMidYMid meet"` on viewBox 430×115
              inside a 346×100 display box). To make HTML sit exactly
              inside the dome interior — and behave identically on iPad —
              we mirror that exact transform: the content wrapper lives
              in viewBox (430×115) coordinates, then gets `scale(SHELL_W/
              430)` applied. Its top-left is aligned with the SVG's
              top-left (-10, -20 + meet-centering offset of 3.73) so
              every child sits precisely where its viewBox coords dictate.
              That makes the layout identical to the old foreignObject
              but with zero Safari bugs. ──────────────────────────── */}
        <div
          style={{
            position: "absolute",
            left: -10,
            top: -20 + (SHELL_H - SHELL_W * (115 / 430)) / 2,
            width: 430,
            height: 115,
            transform: `scale(${SHELL_W / 430})`,
            transformOrigin: "0 0",
            pointerEvents: "none",
          }}
        >
          <div
            className="vrx-fab-content"
            style={{
              width: 430,
              height: 115,
              padding: "16px 80px 26px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 11,
            }}
          >
            {/* ── Mic surface (cream) — wired to onToggleMute ── */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onToggleMute() }}
              disabled={isAwaitingResponse}
              aria-label={manualMute ? "Unmute microphone" : "Mute microphone"}
              aria-pressed={manualMute}
              className={cn(
                "vrx-fab-surface pointer-events-auto transition-transform active:scale-[0.92]",
                "disabled:cursor-not-allowed disabled:opacity-55",
              )}
              style={{
                width: 48,
                height: 48,
                borderRadius: 999,
                background: manualMute ? "#F59E0B" : "#fff4e6",
                boxShadow: manualMute
                  ? "inset 0 1px 0 rgba(255,255,255,0.25), 0 8px 18px rgba(245,158,11,0.35)"
                  : "inset 0 1px 0 rgba(255,255,255,0.75), 0 12px 20px rgba(22,8,32,0.12)",
                border: "0",
                flex: "0 0 auto",
              }}
            >
              {/* Inner rotation (-90°) un-rotates the icon so it reads upright in the final vertical FAB */}
              <span style={{ display: "inline-flex", transform: "rotate(-90deg)", transformOrigin: "center" }}>
                <VoiceMicIcon size={30} color={manualMute ? "#FFFFFF" : "#F59E0B"} muted={manualMute} />
              </span>
            </button>

            {/* ── Center stack: wave+timer row, listening row ── */}
            <div
              style={{
                minWidth: 0,
                flex: "0 1 auto",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 5,
              }}
            >
              {/* Wave + timer */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 3,
                  maxWidth: "100%",
                }}
              >
                <div style={{ width: 94, height: 24, flex: "0 0 auto" }}>
                  <LiveWaveform
                    stream={stream}
                    active={!paused && !!stream}
                    height={24}
                    barColor="#FFFFFF"
                    barWidth={2}
                    barGap={1}
                    barHeight={5}
                    fadeEdges
                    targetBarCount={15}
                  />
                </div>
                <span
                  style={{
                    color: "rgba(255,255,255,0.72)",
                    fontSize: 14,
                    fontWeight: 400,
                    letterSpacing: "-0.04em",
                    whiteSpace: "nowrap",
                    fontVariantNumeric: "tabular-nums",
                    flex: "0 0 auto",
                  }}
                >
                  {elapsedLabel}
                </span>
              </div>

              {/* Label + dots */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  maxWidth: "100%",
                }}
              >
                <span
                  style={{
                    color: "rgba(246,237,248,0.78)",
                    fontSize: 14,
                    fontWeight: 400,
                    letterSpacing: "-0.03em",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {statusLabel === "Listening" ? "I'm listening" : statusLabel}
                </span>
                {!paused && (
                  <span aria-hidden style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                    <span className="vrx-fab-dot" style={{ animationDelay: "0ms" }} />
                    <span className="vrx-fab-dot" style={{ animationDelay: "180ms" }} />
                    <span className="vrx-fab-dot" style={{ animationDelay: "360ms" }} />
                  </span>
                )}
              </div>
            </div>

            {/* ── Submit surface (white) — wired to onSubmit ── */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onSubmit() }}
              disabled={!canSubmit}
              aria-label="Submit consultation"
              className={cn(
                "vrx-fab-surface pointer-events-auto transition-transform",
                canSubmit ? "active:scale-[0.92]" : "cursor-not-allowed opacity-40",
              )}
              style={{
                width: 48,
                height: 48,
                borderRadius: 999,
                background: "#FFFFFF",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.85), 0 12px 24px rgba(22,8,32,0.20)",
                border: "0",
                flex: "0 0 auto",
              }}
            >
              {isAwaitingResponse ? (
                <span
                  className="animate-spin"
                  style={{
                    display: "inline-block",
                    width: 22,
                    height: 22,
                    borderRadius: 999,
                    border: "2.5px solid rgba(26,16,33,0.20)",
                    borderTopColor: "#1A1021",
                  }}
                  aria-hidden
                />
              ) : (
                <span style={{ display: "inline-flex", transform: "rotate(-90deg)", transformOrigin: "center" }}>
                  <TickIcon size={28} gradientId={`${uid}-tick`} />
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes vrxFabIn {
          from { opacity: 0; transform: translateY(12px) scale(0.92); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .vrx-fab-surface { display: inline-flex; align-items: center; justify-content: center; cursor: pointer; }
        .vrx-fab-dot {
          width: 3px; height: 3px; border-radius: 9999px;
          background: rgba(255,255,255,0.62);
          animation: vrxFabDot 1.4s ease-in-out infinite;
        }
        @keyframes vrxFabDot {
          0%, 100% { opacity: 0.25; transform: translateY(0); }
          50%      { opacity: 1;    transform: translateY(-1px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .vrx-fab-dot { animation: none; }
        }
      `}</style>
    </div>
  )
}
