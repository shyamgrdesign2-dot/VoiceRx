"use client"

import React, { useId } from "react"
import { cn } from "@/lib/utils"

interface DrAgentFabProps {
  onClick: () => void
  /** Kept for API compat — the FAB intentionally no longer renders a
   *  nudge dot (the chip itself is the nudge; a separate red pulse was
   *  competing visually). Callers can keep passing this without effect. */
  hasNudge?: boolean
  /** Kept for API compatibility — the FAB is NEVER rendered while recording
   *  (the voice-consult MiniFab portals its own richer controller), so this
   *  prop is effectively ignored. */
  isRecording?: boolean
  /** Whether the parent agent panel is currently open. Used to coordinate
   *  a smooth slide/fade exit animation so the FAB feels linked to the panel. */
  isPanelOpen?: boolean
  /** When a per-module VoiceRxModuleRecorder is actively recording in a
   *  sidebar section, the FAB switches to a "recording" treatment so the
   *  doctor sees voice is still capturing even when focused elsewhere. */
  isModuleRecording?: boolean
}

/**
 * Reference organic-dome path — identical to the VoiceRx MiniFab (430×115
 * viewBox). Reusing the exact path + filter + gradient keeps the two
 * floating surfaces visually consistent — they read as the SAME family,
 * the MiniFab is just a scaled-up "expanded" sibling of this idle chip.
 */
/** White 4-point spark — same AI glyph family used in the chat bubble &
 *  agent brand tag, with a subtle shimmer so the idle FAB feels alive. */
function WhiteSparkIcon({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="4 4 16 16"
      fill="none"
      aria-hidden="true"
      className="animate-[sparkShimmer_4s_ease-in-out_infinite]"
    >
      <style>{`
        @keyframes sparkShimmer {
          0%, 100% { opacity: 0.88; transform: scale(1) rotate(0deg); }
          50% { opacity: 1; transform: scale(1.12) rotate(15deg); }
        }
      `}</style>
      <path
        d="M18.0841 11.612C18.4509 11.6649 18.4509 12.3351 18.0841 12.388C14.1035 12.9624 12.9624 14.1035 12.388 18.0841C12.3351 18.4509 11.6649 18.4509 11.612 18.0841C11.0376 14.1035 9.89647 12.9624 5.91594 12.388C5.5491 12.3351 5.5491 11.6649 5.91594 11.612C9.89647 11.0376 11.0376 9.89647 11.612 5.91594C11.6649 5.5491 12.3351 5.5491 12.388 5.91594C12.9624 9.89647 14.1035 11.0376 18.0841 11.612Z"
        fill="white"
      />
    </svg>
  )
}

const FAB_PATH =
  "M395.24 23.6125C381.35 31.5666 366.81 41.5232 360.83 55.4195C352.63 74.3548 341.13 86.7689 319.47 86.769H110.53C88.87 86.7689 77.37 74.3548 69.17 55.4195C63.19 41.5232 48.62 31.5666 34.73 23.6125L28.43 20H401.32L395.24 23.6125Z"

/**
 * DrAgentFab — idle floating chip on the right viewport edge, shown when
 * the VoiceRx panel is closed. Shares the SAME organic dome SVG family
 * as the VoiceRx MiniFab, scaled ~1.5× smaller and carrying only the
 * brand affordance: the animated chevron + "VoiceRx" label.
 *
 * Layout:
 *   • Outer  — fixed vertical box (SHELL_H × SHELL_W after rotation).
 *   • Inner  — rotated 90° so the horizontal dome reads vertical.
 *   • SVG    — dome path + drop-shadow + gradient (#D565EA → #673AAC → #1A1994).
 *   • HTML   — native overlay scaled in viewBox coords (the same trick
 *              used by the MiniFab) so the icon + label sit exactly
 *              inside the dome interior on every browser including iPad.
 *
 * Click reopens the panel via `onClick`.
 */
function RecordingMicIcon({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="animate-[fabMicPulse_1.4s_ease-in-out_infinite]"
    >
      <style>{`
        @keyframes fabMicPulse {
          0%, 100% { opacity: 0.85; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.08); }
        }
      `}</style>
      <path d="M12 19v3" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="9" y="2" width="6" height="13" rx="3" fill="white" fillOpacity="0.3" stroke="white" strokeWidth="1.8" />
    </svg>
  )
}

export function DrAgentFab({ onClick, isPanelOpen, isModuleRecording }: DrAgentFabProps) {
  // 1.5× smaller than the MiniFab's 346×100. Kept as integers so the
  // browser doesn't introduce subpixel rounding artefacts on the shell.
  const SHELL_W = 230
  const SHELL_H = 66
  // The HTML overlay lives in raw viewBox (430×115) coordinates and is
  // scaled to match the rendered shell. preserveAspectRatio="xMidYMid
  // meet" centers the 92.5-px-tall path vertically inside the 66-px
  // display, so we offset the HTML by the same amount.
  const VB_H_SCALED = SHELL_W * (115 / 430)   // rendered path height
  const MEET_OFFSET_Y = (SHELL_H - VB_H_SCALED) / 2
  const SCALE = SHELL_W / 430

  const uid = useId()
  const shadowId = `${uid}-fab-shadow`
  const shellId = `${uid}-fab-shell`

  return (
    <div
      className={cn(
        "group pointer-events-auto fixed z-40 cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
        isPanelOpen ? "translate-x-[110%] opacity-0 pointer-events-none" : "translate-x-0 opacity-100"
      )}
      style={{
        bottom: 32,
        right: 0,
        width: SHELL_H,   // after 90° rotation, height-of-dome becomes visual width
        height: SHELL_W,  // width-of-dome becomes visual height
      }}
      role="button"
      tabIndex={0}
      aria-label="Open VoiceRx"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick()
      }}
    >
      {/* Hover tooltip — left of the chip */}
      <div className="pointer-events-none absolute right-[calc(100%+6px)] top-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <div className="relative whitespace-nowrap rounded-md bg-tp-slate-800 px-2 py-1 text-[12px] font-medium text-white shadow-lg">
          {isModuleRecording ? "Voice recording in progress" : "Open VoiceRx"}
          <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 border-[4px] border-transparent border-l-tp-slate-800" />
        </div>
      </div>

      {/* Inner rotated container — horizontal dome rotated 90° so it reads
          vertically on the viewport edge. */}
      <div
        className="dr-agent-fab-inner absolute"
        style={{
          left: "50%",
          top: "50%",
          width: SHELL_W,
          height: SHELL_H,
          transform: "translate(-50%,-50%) rotate(90deg)",
          transformOrigin: "center center",
        }}
      >
        {/* SVG shell — path + drop shadow + gradient fill, identical to MiniFab */}
        <svg
          aria-hidden
          className="block overflow-visible"
          style={{
            width: SHELL_W,
            height: SHELL_H,
            position: "absolute",
            left: -7,
            top: -14,
            pointerEvents: "none",
          }}
          viewBox="0 0 430 115"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <filter
              id={shadowId}
              x="0"
              y="0"
              width="430"
              height="114.769"
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
            {/* TP AI brand gradient — LEFT→RIGHT sweep across the dome's
                long axis (pink → violet → indigo). */}
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

        {/* HTML interior in viewBox coordinates, uniformly scaled to match
            the SVG display. The chevron + label land precisely inside the
            dome interior this way, on every browser (iPad included). */}
        <div
          style={{
            position: "absolute",
            left: -7,
            top: -14 + MEET_OFFSET_Y,
            width: 430,
            height: 115,
            transform: `scale(${SCALE})`,
            transformOrigin: "0 0",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              width: 430,
              height: 115,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 14,
              padding: "16px 60px 26px",
            }}
          >
            {isModuleRecording ? <RecordingMicIcon size={42} /> : <WhiteSparkIcon size={42} />}
            <span
              style={{
                color: "white",
                fontSize: 28,
                fontWeight: 600,
                letterSpacing: "0.3px",
                textShadow: "0 1px 3px rgba(0,0,0,0.25)",
                whiteSpace: "nowrap",
                lineHeight: 1,
              }}
            >
              {isModuleRecording ? "Rec…" : "VoiceRx"}
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes drAgentFabIn {
          from { opacity: 0; transform: translateY(12px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        /* Hover: NO scale / translate. A subtle brightness lift instead,
           so the chip doesn't "pop out" of the viewport edge the way the
           old 1.06× scale made it. */
        .dr-agent-fab-inner {
          filter: brightness(1);
          transition: filter 180ms ease;
        }
        .group:hover .dr-agent-fab-inner {
          filter: brightness(1.12);
        }
      `}</style>
    </div>
  )
}
