/**
 * SecondarySidebar — top-level orchestrator.
 * Manages active section state and renders:
 *   • NavPanel   (80px, dark-purple gradient, scrollable, with 3-state icons)
 *   • ContentPanel (250px, white, section-scrollable, sticky section headers)
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { NavPanel } from "./NavPanel";
import { ContentPanel } from "./ContentPanel";

import { useRxPadSync } from "@/src/components/organisms/rxpad/rxpad-sync-context";
import { ConfirmDialog as TPConfirmDialog } from "@/src/components/molecules/ConfirmDialog";
import { SECTIONS_WITH_DATA, SECTIONS_EMPTY } from "./types";

/** All valid NavItemIds for validation */
const ALL_NAV_IDS = new Set([...SECTIONS_WITH_DATA, ...SECTIONS_EMPTY]);

/**
 * Section traversal order for swipe / overscroll navigation. Mirrors the
 * top-to-bottom order in NavPanel so swiping feels spatially consistent.
 * `drAgent` is excluded — it lives in its own panel.
 */
const NAV_SEQUENCE = [
"pastVisits",
"vitals",
"history",
"labResults",
"medicalRecords",
"gynec",
"obstetric",
"vaccine",
"growth",
// Ophthal (Optal) sits above Private Notes — Private Notes is the
// last item in the rail because it's a free-form scratchpad rather
// than structured patient history.
"optal",
"personalNotes"];


function neighbourSection(current, dir) {
  const idx = NAV_SEQUENCE.indexOf(current);
  if (idx === -1) return null;
  const target = dir === "next" ? idx + 1 : idx - 1;
  return NAV_SEQUENCE[target] ?? null;
}






export function SecondarySidebar({ collapseExpandedOnly = false, onSectionSelect }) {
  const [activeId, setActiveId] = useState("pastVisits");
  const { lastSignal, publishSignal, acknowledgeHistoricalSection, activeVoiceModule, setActiveVoiceModule } = useRxPadSync();
  // Pending nav target while a sidebar voice recording is active —
  // we ask "discard?" before switching sections.
  const [pendingNavTarget, setPendingNavTarget] = useState(null);
  const lastSignalIdRef = useRef(0);

  // Note: collapseExpandedOnly is no longer used — both sidebars can
  // coexist. Kept in the interface for backward compatibility.

  // Listen for section_focus signals from Dr. Agent panel (or elsewhere)
  // and open the corresponding sidebar section
  useEffect(() => {
    if (!lastSignal || lastSignal.id === lastSignalIdRef.current) return;
    lastSignalIdRef.current = lastSignal.id;

    if (lastSignal.type === "section_focus" && lastSignal.sectionId) {
      const targetId = lastSignal.sectionId;
      if (ALL_NAV_IDS.has(targetId)) {
        setActiveId(targetId);
        acknowledgeHistoricalSection(targetId);
        onSectionSelect?.(targetId);
      }
    }
  }, [lastSignal, onSectionSelect, acknowledgeHistoricalSection]);

  // Sidebar-section labels (matches NavPanel.jsx NAV_META). Only when
  // `activeVoiceModule` resolves to one of these labels do we paint the
  // recording dot on a sidebar nav item — RxPad form modules
  // ("Symptoms", "Examinations", "Diagnosis", …) intentionally yield no
  // dot here because their recording state belongs to the form, not
  // the sidebar.
  //
  // This fixes the bug where opening a quick-mic on Symptoms while
  // Records was the open sidebar tab made a red dot show up on Records.
  const SIDEBAR_VOICE_LABELS = {
    "Past Visits": "pastVisits",
    Vitals: "vitals",
    History: "history",
    "Medical History": "history",
    "Lab Results": "labResults",
    Records: "medicalRecords",
    "Medical Records": "medicalRecords",
    Gynec: "gynec",
    "Gynec History": "gynec",
    Obstetric: "obstetric",
    "Obstetric History": "obstetric",
    Vaccine: "vaccine",
    "Vaccination History": "vaccine",
    Growth: "growth",
    Ophthal: "optal",
    "Optal History": "optal",
    "Ophthal History": "optal",
    "Personal Notes": "personalNotes",
    "Private Notes": "personalNotes",
  };
  const voiceActiveSection = activeVoiceModule
    ? SIDEBAR_VOICE_LABELS[activeVoiceModule] ?? null
    : null;

  // True only when a *sidebar* section (Past Visits, Vitals, etc.) is
  // recording — used to lock sidebar tab switching mid-recording. An
  // RxPad-form recording (Symptoms / Examinations / etc.) yields false
  // here so the doctor can still browse the historical sidebar.
  const sidebarVoiceLocked = voiceActiveSection !== null;

  function performSwitch(id) {
    // Compute the next value BEFORE calling setActiveId so the side
    // effects (publishSignal / acknowledgeHistoricalSection /
    // onSectionSelect) don't fire inside the updater function — React
    // 19 flags setState-in-render when a state-setter is invoked
    // during another setter's reducer.
    const prev = activeIdRef.current;
    const next = prev === id ? null : id;
    setActiveId(next);
    if (next) {
      publishSignal({ type: "section_focus", sectionId: next });
      acknowledgeHistoricalSection(next);
    }
    onSectionSelect?.(next);
  }

  function handleSelect(id) {
    // If a sidebar-section voice recording is live, prompt the doctor
    // to discard before switching tabs. The previous behaviour was a
    // silent no-op which read as a broken click. Per design call we
    // surface a TPConfirmDialog ("Discard recording?") and only
    // proceed if the doctor confirms.
    if (sidebarVoiceLocked) {
      setPendingNavTarget(id);
      return;
    }
    performSwitch(id);
  }

  const activeIdRef = useRef(activeId);
  useEffect(() => {activeIdRef.current = activeId;}, [activeId]);

  const handleSwipeNavigate = useCallback(
    (dir) => {
      const current = activeIdRef.current;
      if (!current) return;
      const target = neighbourSection(current, dir);
      if (!target) return;
      setActiveId(target);
      publishSignal({ type: "section_focus", sectionId: target });
      acknowledgeHistoricalSection(target);
      onSectionSelect?.(target);
    },
    [acknowledgeHistoricalSection, onSectionSelect, publishSignal]
  );

  return (
    // overflow-visible → the white selection arrow on the right edge isn't clipped
    <div className="content-stretch flex items-start relative h-full overflow-visible">
      <NavPanel active={activeId} onSelect={handleSelect} voiceActiveSection={voiceActiveSection} />
      {activeId && !collapseExpandedOnly ?
      <ContentPanel
        activeId={activeId}
        onClose={() => {setActiveId(null);onSectionSelect?.(null);}}
        onSwipeNavigate={handleSwipeNavigate} /> :

      null}

      {/* Discard-recording confirm. Primary CTA (right, blue) is the
          SAFE action ("Keep recording"); secondary (left, red link) is
          the destructive option ("Discard & switch") per the existing
          ConfirmDialog convention. */}
      <TPConfirmDialog
        open={Boolean(pendingNavTarget)}
        onOpenChange={(o) => { if (!o) setPendingNavTarget(null); }}
        title="Voice recording is active"
        warning={
          activeVoiceModule
            ? `Voice dictation for ${activeVoiceModule} is in progress. Switching sections will discard the in-progress transcript.`
            : "Switching sections will discard the in-progress transcript."
        }
        primaryLabel="Keep recording"
        onPrimary={() => setPendingNavTarget(null)}
        secondaryLabel="Discard & switch"
        secondaryTone="destructive"
        onSecondary={() => {
          const target = pendingNavTarget;
          setActiveVoiceModule(null);
          setPendingNavTarget(null);
          if (target != null) performSwitch(target);
        }}
      />
    </div>);

}