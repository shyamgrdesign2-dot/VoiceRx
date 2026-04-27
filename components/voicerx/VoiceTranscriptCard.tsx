"use client"

import { useState } from "react"
import { ChevronUp, Mic } from "lucide-react"

import { cn } from "@/lib/utils"
import type { VoiceConsultKind } from "./voice-consult-types"

interface VoiceTranscriptCardProps {
  mode?: VoiceConsultKind
  transcript: string
  /** Total recording length in ms — rendered as mm:ss in the header pill. */
  durationMs?: number
  /** Open/closed by default. Card is a collapsible accordion. */
  defaultExpanded?: boolean
  className?: string
}

/**
 * Shared turn shape used by the ambient view.
 */
interface TranscriptTurn {
  speaker: "doctor" | "patient"
  text: string
}

function formatDuration(ms?: number): string {
  if (!ms || ms < 0) return "0:00"
  const total = Math.floor(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

/**
 * Ambient transcripts are tagged with "Doctor:" / "Patient:" prefixes
 * (see VOICE_RX_AMBIENT_CHUNKS). This parses the text into alternating
 * turns that the card renders as chat bubbles. Returns null if no
 * speaker markers are detected so the card falls back to a flat
 * paragraph.
 */
function parseAmbientTurns(text: string): TranscriptTurn[] | null {
  // Split on "Doctor:" / "Patient:" while keeping the matched tokens
  const tokens = text.split(/\b(Doctor|Patient)\s*:\s*/gi)
  // tokens is [leading?, "Doctor", body, "Patient", body, "Doctor", body, ...]
  if (tokens.length < 3) return null
  const turns: TranscriptTurn[] = []
  // Skip any leading non-matched text (index 0) and pair up speaker + body
  for (let i = 1; i < tokens.length - 1; i += 2) {
    const speaker = tokens[i].toLowerCase()
    const body = tokens[i + 1]?.trim()
    if (!body) continue
    turns.push({ speaker: speaker === "patient" ? "patient" : "doctor", text: body })
  }
  return turns.length ? turns : null
}

/**
 * VoiceTranscriptCard — the new transcript representation rendered in the
 * chat thread right after a voice submission.
 *
 * Header
 *   • Title: "Dictate Rx Transcript" | "Ambient Rx Transcript"
 *   • Mic-pill with elapsed duration ("1:23")
 *   • Chevron toggle — accordion expand/collapse
 *
 * Body
 *   • Dictation: flat paragraph (continuous clinical narration)
 *   • Ambient:   Doctor/Patient turns rendered as alternating chat
 *                bubbles (Doctor = left, neutral slate; Patient = right,
 *                brand-violet tint)
 */
export function VoiceTranscriptCard({
  mode = "dictation_consultation",
  transcript,
  durationMs,
  defaultExpanded = true,
  className,
}: VoiceTranscriptCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  const title =
    mode === "ambient_consultation" ? "Conversation Transcript" : "Dictation Transcript"

  const turns =
    mode === "ambient_consultation" ? parseAmbientTurns(transcript) : null

  return (
    <div
      className={cn(
        // Card = same background as regular user bubbles (tp-slate-100),
        // no outer stroke, same user-bubble corner shape (flat
        // bottom-right so it hugs the avatar gutter). Header overrides
        // with a white band; everything else inherits the slate-100.
        "w-full overflow-hidden rounded-[12px] rounded-br-[0px] bg-tp-slate-100",
        className,
      )}
    >
      {/* ── Header — white band, differentiates from the slate-100 body ── */}
      <div className="flex items-center justify-between gap-[10px] bg-white px-[14px] py-[10px]">
        {/* Title tuned down: smaller, medium weight (not semibold),
            slate-500 tone. Reads as a quiet section label, not a CTA. */}
        <h4 className="truncate text-[13px] font-medium leading-[18px] tracking-[-0.05px] text-tp-slate-500">
          {title}
        </h4>
        <div className="flex flex-shrink-0 items-center gap-[8px]">
          {/* Mic + timer chip — lighter so it doesn't read as a CTA.
              Background slate-50/60 + text slate-400/80 keeps it subtle. */}
          <span
            className="inline-flex items-center gap-[4px] rounded-full bg-tp-slate-50/80 px-[9px] py-[3.5px] text-[12px] font-medium text-tp-slate-400 tabular-nums"
            aria-label={`Recording duration ${formatDuration(durationMs)}`}
          >
            <Mic size={12} strokeWidth={1.8} aria-hidden />
            {formatDuration(durationMs)}
          </span>
          {/* Accordion toggle — icon-only, no chrome. */}
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? "Collapse transcript" : "Expand transcript"}
            aria-expanded={expanded}
            className="flex h-[24px] w-[24px] items-center justify-center rounded-[6px] text-tp-slate-400 transition-colors hover:bg-tp-slate-100 hover:text-tp-slate-600 active:scale-[0.96]"
          >
            <ChevronUp
              size={14}
              strokeWidth={2}
              aria-hidden
              className={cn(
                "transition-transform duration-200",
                expanded ? "" : "rotate-180",
              )}
            />
          </button>
        </div>
      </div>

      {/* ── Body — inherits the outer slate-100 (no extra bg) so the
           card reads as one surface below the white header band. ── */}
      {expanded && (
        <div className="px-[14px] py-[12px]">
          {turns ? (
            <div className="flex flex-col gap-[8px]">
              {turns.map((turn, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex w-full",
                    turn.speaker === "patient" ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      // Softer: bubble bg opacity reduced, text tone
                      // lightened + medium weight (instead of semibold
                      // speaker labels) so the turn reads quietly.
                      "max-w-[85%] rounded-[12px] px-[12px] py-[8px] text-[13px] leading-[1.55] text-tp-slate-500",
                      turn.speaker === "patient"
                        ? "rounded-br-[4px] bg-[rgba(139,92,246,0.07)]"
                        : "rounded-bl-[4px] bg-white/60",
                    )}
                  >
                    <span className="font-medium text-tp-slate-600">
                      {turn.speaker === "patient" ? "Patient:" : "Doctor:"}
                    </span>{" "}
                    {turn.text}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="whitespace-pre-wrap text-[13px] leading-[1.6] text-tp-slate-500">
              <span className="mr-[2px] text-tp-slate-300">&ldquo;</span>
              {transcript}
              <span className="ml-[2px] text-tp-slate-300">&rdquo;</span>
            </p>
          )}
        </div>
      )}
    </div>
  )
}
