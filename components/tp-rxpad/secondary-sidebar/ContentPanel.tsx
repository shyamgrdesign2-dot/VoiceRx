/**
 * Right content panel.
 * Contains a gradient section header + the scrollable section content.
 */
import React, { useEffect, useRef, useState } from "react";
import { SidebarLeft } from "iconsax-reactjs";
import { AiTriggerIcon } from "@/components/tp-rxpad/dr-agent/shared/AiTriggerIcon";
import { useRxPadSync } from "@/components/tp-rxpad/rxpad-sync-context";
import { useEdgeSwipeNavigation } from "./useEdgeSwipeNavigation";
import { TPConfirmDialog } from "@/components/tp-ui/tp-confirm-dialog";

// ─── Content imports ──────────────────────────────────────────────────────────

// DrAgentContent removed — Dr.Agent lives in its own panel, not in the sidebar
import { PastVisitsContent }        from "./content/PastVisitsContent";
import { VitalsContent }            from "./content/VitalsContent";
import { HistoryContent }           from "./content/HistoryContent";
import { GynecHistoryContent }      from "./content/GynecHistoryContent";
import { ObstetricHistoryContent }  from "./content/ObstetricHistoryContent";
import { VaccineContent }           from "./content/VaccineContent";
import { GrowthContent }            from "./content/GrowthContent";
import { MedicalRecordsContent }    from "./content/MedicalRecordsContent";
import { LabResultsContent }        from "./content/LabResultsContent";
import { PersonalNotesContent }     from "./content/PersonalNotesContent";
import { EmptyStateContent }        from "./content/EmptyStateContent";

import type { NavItemId } from "./types";
import { rxSidebarTokens } from "./tokens";

/**
 * Inline keyframes — kept colocated with the component so HMR picks them up
 * deterministically (Turbopack was missing rules appended to globals.css).
 */
const SECTION_TRANSITION_CSS = `
@keyframes rxSectionSlideUp {
  0%   { transform: translateY(14%); opacity: 0; }
  100% { transform: translateY(0);    opacity: 1; }
}
@keyframes rxSectionSlideDown {
  0%   { transform: translateY(-14%); opacity: 0; }
  100% { transform: translateY(0);     opacity: 1; }
}
.rx-section-slide-up   { animation: rxSectionSlideUp   280ms cubic-bezier(0.22, 1, 0.36, 1) both; }
.rx-section-slide-down { animation: rxSectionSlideDown 280ms cubic-bezier(0.22, 1, 0.36, 1) both; }
@media (prefers-reduced-motion: reduce) {
  .rx-section-slide-up, .rx-section-slide-down { animation: none; }
}
`;

// ─── Section title map ────────────────────────────────────────────────────────

const SECTION_TITLES: Record<NavItemId, string> = {
  drAgent:       "Dr Agent",
  pastVisits:    "Past Visit",
  vitals:        "Vitals",
  history:       "History",
  gynec:         "Gynec History",
  obstetric:     "Obstetric History",
  vaccine:       "Vaccination",
  growth:        "Growth",
  medicalRecords:"Medical Records",
  labResults:    "Lab Results",
  personalNotes: "Personal Notes",
};

// ─── Section header (gradient bar) ───────────────────────────────────────────

function sectionHeaderAiLabel(activeId: NavItemId, title: string): string | null {
  switch (activeId) {
    case "pastVisits":
      return "Ask Dr. Agent to summarize all past visits"
    case "vitals":
      return "Ask Dr. Agent to analyze today's vitals and flag concerns"
    case "history":
      return "Ask Dr. Agent to summarize the complete medical history"
    case "gynec":
      return "Ask Dr. Agent to review gynecological history and due screenings"
    case "obstetric":
      return "Ask Dr. Agent to review obstetric history and pending ANC items"
    case "vaccine":
      return "Ask Dr. Agent to check vaccination schedule and pending doses"
    case "growth":
      return "Ask Dr. Agent to analyze growth trends and percentiles"
    case "labResults":
      return "Ask Dr. Agent to review flagged lab values and trends"
    case "personalNotes":
      return "Ask Dr. Agent to summarize your personal notes"
    case "medicalRecords":
      return null
    default:
      return `Ask Dr. Agent about ${title.toLowerCase()}`
  }
}

function SectionHeader({ title, activeId, onClose }: { title: string; activeId: NavItemId; onClose?: () => void }) {
  const headerSignalLabel = sectionHeaderAiLabel(activeId, title)
  // Recording-aware collapse. If a per-section recorder is live,
  // collapsing the panel would tear down the recorder mid-sentence.
  // Confirm first; on "Discard" we still call `onClose` so the
  // parent owns the actual cleanup. Global VoiceRx FAB flow does NOT
  // block collapse — it lives in its own panel.
  const { activeVoiceModule } = useRxPadSync()
  const isVoiceLive = !!activeVoiceModule
  const [confirmOpen, setConfirmOpen] = useState(false)

  const handleCollapseClick = () => {
    if (isVoiceLive) {
      setConfirmOpen(true)
      return
    }
    onClose?.()
  }

  return (
    <div
      className="group/section-header h-[40px] shrink-0 w-full relative"
      style={{ backgroundImage: "linear-gradient(101.381deg, rgb(55,54,166) 2.0111%, rgb(38,38,136) 83.764%)" }}
    >
      <div className="content-stretch flex gap-[24px] items-center px-[12px] py-[8px] relative size-full">
        {/* Title */}
        <div className="content-stretch flex flex-[1_0_0] items-center gap-[6px] min-h-px min-w-px relative">
          <p className={`${rxSidebarTokens.titleClass} not-italic relative shrink-0 text-white whitespace-nowrap`}>
            {title}
          </p>
          {headerSignalLabel ? (
            <span className="opacity-0 transition-opacity group-hover/section-header:opacity-100">
              <AiTriggerIcon
                tooltip={headerSignalLabel}
                signalLabel={headerSignalLabel}
                sectionId={activeId}
                size={11}
                as="span"
                tone="inverse"
              />
            </span>
          ) : null}
        </div>
        {/* Collapse icon — always interactive (data-voice-allow) so the
            global voice-lock doesn't swallow the click; we own the
            confirmation flow ourselves. */}
        <button
          type="button"
          className="text-white/80 transition-opacity hover:text-white"
          onClick={handleCollapseClick}
          data-voice-allow
          aria-label={isVoiceLive ? "Collapse section panel (voice recording is active)" : "Collapse section panel"}
        >
          <SidebarLeft size={16} variant="Linear" />
        </button>
      </div>
      <TPConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Recording is in progress"
        warning={
          activeVoiceModule
            ? `Voice dictation for ${activeVoiceModule} is still active. Closing this panel will discard the in-progress transcript.`
            : "VoiceRx is currently recording. Closing this panel will not stop the recording, but the transcript so far will be lost from this section."
        }
        secondaryLabel="Keep recording"
        onSecondary={() => setConfirmOpen(false)}
        primaryLabel="Discard and close"
        primaryTone="destructive"
        onPrimary={() => {
          setConfirmOpen(false)
          onClose?.()
        }}
      />
    </div>
  );
}

// ─── Content switcher ─────────────────────────────────────────────────────────

function SectionContent({ activeId }: { activeId: NavItemId }) {
  switch (activeId) {
    // drAgent no longer in sidebar — falls through to pastVisits
    case "pastVisits":     return <PastVisitsContent />;
    case "vitals":         return <VitalsContent />;
    case "history":        return <HistoryContent />;
    case "gynec":          return <GynecHistoryContent />;
    case "obstetric":      return <ObstetricHistoryContent />;
    case "vaccine":        return <VaccineContent />;
    case "growth":         return <GrowthContent />;
    case "medicalRecords": return <MedicalRecordsContent />;
    case "labResults":     return <LabResultsContent />;
    case "personalNotes":  return <PersonalNotesContent />;
    default:               return <EmptyStateContent sectionLabel={SECTION_TITLES[activeId]} />;
  }
}

// ─── Public export ────────────────────────────────────────────────────────────

type Props = {
  activeId: NavItemId;
  onClose?: () => void;
  /**
   * Fired when an edge-swipe / overscroll gesture asks to move to the next or
   * previous section. The parent owns active-section state and decides whether
   * to honour the request.
   */
  onSwipeNavigate?: (dir: "next" | "prev") => void;
};

/**
 * Track which direction the section just changed (next vs prev) so the slide
 * animation can play in the correct direction. Returns the direction of the
 * latest change — "next" / "prev" / null on first render.
 */
function useTransitionDirection(activeId: NavItemId): "next" | "prev" | null {
  const NAV_ORDER = React.useMemo(
    () => [
      "pastVisits", "vitals", "history", "labResults", "medicalRecords",
      "gynec", "obstetric", "vaccine", "growth", "personalNotes",
    ] as NavItemId[],
    [],
  );
  const previousId = useRef<NavItemId | null>(null);
  const [dir, setDir] = useState<"next" | "prev" | null>(null);

  useEffect(() => {
    const prev = previousId.current;
    if (prev && prev !== activeId) {
      const prevIdx = NAV_ORDER.indexOf(prev);
      const nextIdx = NAV_ORDER.indexOf(activeId);
      if (prevIdx !== -1 && nextIdx !== -1) {
        setDir(nextIdx > prevIdx ? "next" : "prev");
      }
    }
    previousId.current = activeId;
  }, [activeId, NAV_ORDER]);

  return dir;
}

export function ContentPanel({ activeId, onClose, onSwipeNavigate }: Props) {
  const { acknowledgeHistoricalSection, isHistoricalSectionUnseen } = useRxPadSync()
  const unseenHere = isHistoricalSectionUnseen(activeId)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const transitionDir = useTransitionDirection(activeId)

  useEffect(() => {
    if (unseenHere) acknowledgeHistoricalSection(activeId)
  }, [activeId, unseenHere, acknowledgeHistoricalSection])

  useEdgeSwipeNavigation({
    containerRef,
    onNavigate: (dir) => onSwipeNavigate?.(dir),
    enabled: Boolean(onSwipeNavigate),
    resetKey: activeId,
  })

  // Animation class — picked per direction. Animation defined in globals.css.
  const animClass =
    transitionDir === "next"
      ? "rx-section-slide-up"
      : transitionDir === "prev"
        ? "rx-section-slide-down"
        : "";

  return (
    <div
      ref={containerRef}
      className="bg-white content-stretch flex h-full w-[250px] min-w-[250px] max-w-[250px] shrink-0 flex-col items-center relative xl:w-[clamp(250px,26vw,350px)] xl:max-w-[350px]"
      /* During voice lockdown, this panel is VIEW-ONLY — but view-only still
         means the user can collapse/expand groups, switch tabs, download /
         preview images, etc. So we opt the whole panel into the allow list;
         the VoiceRxFlow `shouldPass()` will still block text inputs /
         textareas / contenteditable surfaces regardless, and individual
         Add-or-Edit CTAs can be tagged `data-voice-block` to lock them too. */
      data-voice-allow
    >
      {/* Single style injection — rules apply to all rx-section-slide-* wrappers */}
      <style>{SECTION_TRANSITION_CSS}</style>
      <div aria-hidden="true" className={`absolute ${rxSidebarTokens.panelBorderClass} border-r border-solid inset-[0_-1px_0_0] pointer-events-none`} />
      <SectionHeader title={SECTION_TITLES[activeId]} activeId={activeId} onClose={onClose} />
      {/* flex-[1_0_0] + min-h-px → constrains height so inner overflow-y-auto works.
          overflow-hidden on the absolute layer prevents the slide animation from
          spilling outside the panel during the transition. */}
      <div className="flex-[1_0_0] min-h-px min-w-px relative w-full overflow-hidden">
        <div className="absolute inset-0 flex flex-col">
          {/* `key={activeId}` forces React to remount on section change so the
              animation re-plays. */}
          <div
            key={activeId}
            className={`flex min-h-0 flex-1 flex-col overflow-y-auto ${animClass}`}
          >
            <SectionContent activeId={activeId} />
          </div>
        </div>
      </div>
    </div>
  );
}
