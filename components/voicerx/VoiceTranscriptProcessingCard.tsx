"use client"

/**
 * VoiceTranscriptProcessingCard — the card that takes over the Dr.Agent
 * chat surface immediately after the user submits a voice consultation.
 *
 * Two visual phases, ~10s total:
 *   1. STRUCTURING (~7s)
 *      • Card body shows the live/transformed transcript inside a 400px
 *        scrollable area, wrapped by an animated TP-blue "shine border"
 *        that rotates clockwise on a static white base.
 *      • Below the card sits a shimmer caption-carousel loader cycling
 *        through ~3 phrases ("Structuring your transcript...", etc.) +
 *        a small spinner — the doctor knows we're working.
 *   2. TABS (after total ~10s)
 *      • The same card chrome morphs into a tabbed view:
 *        Transcript / TP EMR / Clinical Notes
 *      • Defaults to TP EMR (per spec), Clinical Notes shows the
 *        existing note format slot.
 *      • The shine border keeps spinning subtly so the AI-generation
 *        feel persists, but the caption loader retires.
 *
 * Props:
 *   - mode: "ambient_consultation" | "dictation" — drives transcript
 *     rendering (doctor/patient bubbles vs single paragraph).
 *   - transcript: raw transcript text to render in the Transcript tab.
 *   - structuringMs / totalMs: timings; defaulting to 3000 / 10000 to
 *     match the spec ("3s before transcript appears, ~7s more before
 *     tabs reveal"). Submit-button spinner duration is owned by the
 *     parent's `isAwaitingResponse` flag.
 *   - tpEmrSlot / clinicalNotesSlot: tab body slots — pass already-
 *     rendered cards (e.g. existing VoiceStructuredRxCard for TP EMR).
 *     If undefined, the tab shows a placeholder.
 *   - onComplete: optional callback fired when the tabs phase begins
 *     (parent can cancel/replace this card with the final card list).
 */

import { useEffect, useMemo, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { ShineBorder } from "@/components/magicui/shine-border"

/**
 * Tiny in-view hook — fires `inView=true` once the target's bounding box
 * crosses the viewport (or scroll-root) by `threshold`. Stays true after
 * first reveal so the stagger animation plays exactly once even if the
 * element scrolls in and out.
 */
function useInView<T extends HTMLElement>(threshold = 0.2): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      setInView(true)
      return
    }
    const node = ref.current
    if (!node) return
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setInView(true)
            obs.disconnect()
            return
          }
        }
      },
      { threshold },
    )
    obs.observe(node)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, inView]
}

type ConsultMode = "ambient_consultation" | "dictation" | string | null | undefined

interface Props {
  mode: ConsultMode
  transcript: string
  structuringMs?: number
  totalMs?: number
  tpEmrSlot?: React.ReactNode
  clinicalNotesSlot?: React.ReactNode
  onComplete?: () => void
}

type Phase = "structuring" | "tabs"

const CAPTION_PHRASES = [
  "Structuring your transcript",
  "Capturing the clinical data",
  "Drafting the TP EMR",
  "Generating clinical notes",
] as const

// ─── Transcript renderer ─────────────────────────────────────────────────────

/**
 * Split a transcript into doctor/patient turns. Looks for explicit
 * `Doctor:` / `Patient:` markers first; if none are found, falls back to
 * sentence-alternating heuristic (good enough for a demo).
 */
function parseConversation(raw: string): Array<{ speaker: "doctor" | "patient"; text: string }> {
  // Markers can appear ANYWHERE in the stream — when chunks are joined
  // with "" (which is what the demo does) the "Doctor:" / "Patient:"
  // prefixes end up mid-string, not at line starts. Split on a global
  // lookahead so each marker, wherever it sits, anchors a new turn.
  const explicit = raw.split(/(?=\b(?:Doctor|Patient)\s*:)/g).map((s) => s.trim()).filter(Boolean)
  const turns: Array<{ speaker: "doctor" | "patient"; text: string }> = []
  if (explicit.length > 1) {
    for (const seg of explicit) {
      const m = seg.match(/^(Doctor|Patient)\s*:\s*([\s\S]*)/i)
      if (m) turns.push({ speaker: m[1].toLowerCase() as "doctor" | "patient", text: m[2].trim() })
    }
    if (turns.length) return turns
  }
  // Fallback — alternate sentences.
  const sentences = raw.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean)
  return sentences.map((s, i) => ({ speaker: i % 2 === 0 ? "doctor" : "patient", text: s }))
}

export function ConversationTranscript({ raw }: { raw: string }) {
  const turns = useMemo(() => parseConversation(raw), [raw])
  const [rootRef, inView] = useInView<HTMLUListElement>(0.15)
  // Chat-style bubbles: inline "Doctor:" / "Patient:" prefix on the
  // same line as the body, one corner cut to 4px (bottom-left for
  // doctor, bottom-right for patient) so the bubble points back at the
  // speaker. Background mirrors the Dr. Agent chat — translucent white
  // for doctor, soft TP-violet wash for patient.
  return (
    <ul ref={rootRef} className="flex flex-col gap-[8px]">
      {turns.map((t, i) => {
        const label = t.speaker.charAt(0).toUpperCase() + t.speaker.slice(1)
        return (
          <li
            key={i}
            className={cn("flex w-full", t.speaker === "doctor" ? "justify-start" : "justify-end")}
          >
            <div
              className={cn(
                "vrx-chat-turn max-w-[85%] rounded-[12px] px-[12px] py-[8px] text-[13px] leading-[1.55] text-tp-slate-700",
                t.speaker === "doctor"
                  ? "bg-white/70 rounded-bl-[4px] vrx-chat-turn--doctor"
                  : "bg-[rgba(139,92,246,0.07)] rounded-br-[4px] vrx-chat-turn--patient",
                inView && "vrx-chat-turn--in",
              )}
              style={{ animationDelay: `${i * 180}ms` }}
            >
              <span className="font-semibold text-tp-slate-800">{label}:</span>{" "}
              <span>{t.text}</span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export function DictationTranscript({ raw }: { raw: string }) {
  return (
    <p className="whitespace-pre-wrap text-[13px] leading-[1.55] text-tp-slate-800">
      {raw}
    </p>
  )
}

// ─── Caption carousel ────────────────────────────────────────────────────────

/**
 * Shimmer caption carousel — exported so other surfaces (e.g. the active
 * agent footer during the processing phase) can reuse the exact same
 * loader vocabulary instead of re-inventing it.
 */
export function CaptionCarousel() {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const t = window.setInterval(() => setIdx((i) => (i + 1) % CAPTION_PHRASES.length), 2000)
    return () => window.clearInterval(t)
  }, [])
  // Each phrase enters from below (slide-up + fade in) and the previous
  // one slides up out at the same time. Stacking absolutely on top of
  // a fixed-height row so the layout doesn't jump as words change
  // length.
  return (
    <div className="vrx-caption-stage flex w-full items-center justify-center px-[2px] py-[3px] text-[14px] font-semibold leading-[1.4] text-tp-slate-600">
      {/* Single keyed span — React unmounts/remounts on idx change so
          the entrance animation re-runs for every new phrase. Earlier
          this used absolute-positioned children which collapsed the
          parent flex to 0 width and clipped everything past the first
          glyph; the simpler in-flow span sizes correctly. */}
      <span
        key={idx}
        className="vrx-process-caption vrx-caption-slide whitespace-nowrap"
        style={{
          backgroundImage:
            "linear-gradient(100deg, #45455c 0%, #45455c 32%, #D565EA 46%, #673AAC 50%, #1A1994 54%, #45455c 68%, #45455c 100%)",
          backgroundSize: "200% 100%",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          display: "inline-block",
          paddingBottom: 2, // descenders need a hair of room beneath bg-clip text
        }}
      >
        {CAPTION_PHRASES[idx]}…
      </span>
      <style>{`
        @keyframes vrxCaptionSlide {
          0%   { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .vrx-caption-slide {
          /* Two-track animation — slide-up entrance plays once on
             mount; the AI-gradient shimmer keeps sweeping under
             it for the lifetime of the loader. Both run on the
             same element via a comma-separated animation list. */
          animation:
            vrxCaptionSlide 360ms cubic-bezier(0.22, 1, 0.36, 1) both,
            vrxCaptionShine 2.4s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .vrx-caption-slide { animation: none; opacity: 1; transform: none; }
        }
      `}</style>
    </div>
  )
}

// ─── Tabs ────────────────────────────────────────────────────────────────────

type TabId = "tp_emr" | "clinical_notes" | "transcript"

function Tabs({
  active,
  onChange,
}: {
  active: TabId
  onChange: (id: TabId) => void
}) {
  const TABS: { id: TabId; label: string }[] = [
    { id: "tp_emr",          label: "TP EMR"        },
    { id: "clinical_notes",  label: "Clinical Notes" },
    { id: "transcript",      label: "Transcript"    },
  ]
  return (
    <div
      className="flex shrink-0 items-center gap-1 overflow-x-auto whitespace-nowrap border-b border-tp-slate-100 px-3 pt-[6px]"
      style={{ scrollbarWidth: "thin" }}
    >
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={cn(
            "relative shrink-0 px-3 py-2 text-[12.5px] font-medium transition-colors",
            active === t.id ? "text-tp-blue-700" : "text-tp-slate-500 hover:text-tp-slate-800",
          )}
        >
          {t.label}
          {active === t.id ? (
            <span className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-tp-blue-600" />
          ) : null}
        </button>
      ))}
    </div>
  )
}

// ─── Public component ────────────────────────────────────────────────────────

export function VoiceTranscriptProcessingCard({
  mode,
  transcript,
  structuringMs = 3000,
  totalMs = 10000,
  tpEmrSlot,
  clinicalNotesSlot,
  onComplete,
}: Props) {
  // Phase machine — the inline structuring → tabs swap is gone. The
  // shiner card stays on the transcript view for its entire lifetime;
  // the next surface (the full result-tabs panel) takes over from the
  // outer DrAgentPanel via `setVoiceRxResult` instead of morphing this
  // card into a tab strip in place. We still fire `onComplete` on the
  // same schedule so callers that gate other UI on it stay in sync.
  const [phase] = useState<Phase>("structuring")
  const [activeTab, setActiveTab] = useState<TabId>("tp_emr")

  useEffect(() => {
    const t = window.setTimeout(() => {
      onComplete?.()
    }, totalMs - structuringMs)
    return () => window.clearTimeout(t)
  }, [structuringMs, totalMs, onComplete])

  const isAmbient = mode === "ambient_consultation"

  return (
    // Wrapper height is driven by the Dr. Agent panel's centered slot
    // — 45% of the available chat-region height (with sensible min/max
    // floors so it doesn't get tiny on short windows or balloon on tall
    // monitors). The shiner shell + inner scroll inherit `h-full` from
    // here, so the card scales naturally with the panel rather than
    // sitting at a fixed pixel height.
    <div
      className="flex w-full min-h-0 flex-col gap-[10px]"
      style={{ height: "45%", minHeight: 180, maxHeight: 480 }}
    >
      {/* Card chrome: 16px radius, white base + rotating TP-blue shine.
          `vrx-shiner-enter` plays a one-shot fade/slide on mount. */}
      <div
        className="vrx-shiner-enter relative flex w-full min-h-0 flex-1 flex-col overflow-hidden rounded-[16px] bg-tp-slate-100/80"
        style={{ boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}
      >
        {/* Static white outer ring is achieved by the bg-white above; the
            rotating shine sits on top via ShineBorder's `rotate` variant. */}
        <ShineBorder
          variant="rotate"
          borderWidth={1.5}
          /* Faster spin — was 11s, now 3.5s — so the rotating shine
             reads as an active "loading" cue, not ambient decoration.
             Shine palette swapped from solid TP-blue to the AI
             gradient stops (pink → violet → indigo). */
          duration={3.5}
          shineColor={["#D565EA", "#673AAC", "#1A1994"]}
          baseColor="rgba(226,226,234,0.95)"
        />

        {phase === "structuring" ? (
          <div
            className="relative flex min-h-0 flex-1 flex-col overflow-y-auto p-[14px]"
          >
            {/* Bubbles render directly on the shiner card's slate-100
                surface — no inner wrapper. The white doctor bubble +
                violet patient bubble read crisply against it. */}
            {isAmbient ? (
              <ConversationTranscript raw={transcript} />
            ) : (
              <DictationTranscript raw={transcript} />
            )}
          </div>
        ) : (
          <div
            className="relative flex flex-col"
            style={{ maxHeight: "min(74vh, 600px)", minHeight: 320 }}
          >
            <Tabs active={activeTab} onChange={setActiveTab} />
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === "tp_emr" ? (
                tpEmrSlot ?? (
                  <div className="flex h-full items-center justify-center text-[13px] text-tp-slate-400">
                    TP EMR view will land here.
                  </div>
                )
              ) : null}
              {activeTab === "clinical_notes" ? (
                clinicalNotesSlot ?? (
                  <div className="flex h-full items-center justify-center text-[13px] text-tp-slate-400">
                    Clinical notes will land here.
                  </div>
                )
              ) : null}
              {activeTab === "transcript" ? (
                isAmbient ? <ConversationTranscript raw={transcript} /> : <DictationTranscript raw={transcript} />
              ) : null}
            </div>
          </div>
        )}
      </div>

      {/* Caption carousel was moved out of this card and into the
          active agent's footer slot (where the action dock used to
          live), so the loader sits at the bottom of the panel rather
          than directly under the shiner card. */}

      {/* Inline keyframes — caption shimmer + chat-turn cascade + card
          entrance. Spin is built-in via Tailwind's `animate-spin`. */}
      <style>{`
        @keyframes vrxCaptionShine {
          0%   { background-position: 200% 0%; }
          100% { background-position: -200% 0%; }
        }
        .vrx-process-caption { animation: vrxCaptionShine 2.4s linear infinite; }

        /* Chat-turn cascade — each turn starts hidden + offset, then
           slides in from its speaker's side once the parent comes into
           view (the .vrx-chat-turn--in class is toggled by JS). */
        .vrx-chat-turn {
          opacity: 0;
          transform: translateY(8px) translateX(var(--vrx-turn-from, 0));
        }
        .vrx-chat-turn--doctor  { --vrx-turn-from: -10px; }
        .vrx-chat-turn--patient { --vrx-turn-from:  10px; }
        .vrx-chat-turn--in {
          animation: vrxChatTurnIn 360ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        @keyframes vrxChatTurnIn {
          0%   { opacity: 0; transform: translateY(8px) translateX(var(--vrx-turn-from, 0)); }
          100% { opacity: 1; transform: translateY(0)    translateX(0); }
        }

        /* Shiner card entrance — soft fade + slide-up so the card
           doesn't pop into existence when the processing phase begins. */
        .vrx-shiner-enter {
          animation: vrxShinerEnter 420ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes vrxShinerEnter {
          0%   { opacity: 0; transform: translateY(12px) scale(0.985); }
          100% { opacity: 1; transform: translateY(0)    scale(1); }
        }

        @media (prefers-reduced-motion: reduce) {
          .vrx-process-caption,
          .vrx-chat-turn,
          .vrx-chat-turn--in,
          .vrx-shiner-enter { animation: none; opacity: 1; transform: none; }
        }
      `}</style>
    </div>
  )
}
