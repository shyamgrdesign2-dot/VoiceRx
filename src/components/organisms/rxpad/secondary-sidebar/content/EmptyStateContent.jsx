/**
 * Empty-state content panel — shown for a first-time / walk-in patient
 * (or any section with no records yet). Centred layout: file illustration
 * → short section-specific message → CTAs.
 *
 * CTA rules (mirror the real flow):
 *  • Past Visits  → no CTA at all. Past visits are only created when the
 *    doctor submits an Rx, so this section is always view-only.
 *  • Vitals, Medical Records → primary "Add …" only (no voice dictation
 *    in the existing flow).
 *  • Everything else → primary "Add …" (solid blue) + secondary
 *    "Add via voice" (AI gradient) to dictate.
 */
import React from "react";
import { ActionButton } from "../detail-shared";

// Short, section-specific empty copy. Keyed by sidebar section id.
const EMPTY_MESSAGES = {
  pastVisits: "This patient hasn’t had any visits at your hospital yet.",
  vitals: "No vitals have been recorded for this patient yet.",
  history: "No medical history has been recorded for this patient yet.",
  gynec: "No gynec history has been recorded for this patient yet.",
  obstetric: "No obstetric history has been recorded for this patient yet.",
  vaccine: "No vaccination records have been added for this patient yet.",
  growth: "No growth measurements have been recorded for this patient yet.",
  optal: "No ophthal exams have been recorded for this patient yet.",
  labResults: "No lab results have been added for this patient yet.",
  medicalRecords: "No medical records have been uploaded for this patient yet."
};

// Primary CTA label per section ("Add …").
const ADD_LABELS = {
  vitals: "Add Vitals",
  history: "Add Medical History",
  gynec: "Add Gynec History",
  obstetric: "Add Obstetric History",
  vaccine: "Add Vaccination",
  growth: "Add Growth",
  optal: "Add Ophthal History",
  labResults: "Add Lab Results",
  medicalRecords: "Add Medical Records"
};

// Past visits are only created on Rx submission — never added/edited here.
const NO_CTA_SECTIONS = new Set(["pastVisits"]);
// Sections with no voice-dictation flow in the existing app. Medical
// Records is upload-only (no dictation); every other section supports voice.
const NO_VOICE_SECTIONS = new Set(["medicalRecords"]);

export function EmptyStateContent({ sectionLabel, sectionId }) {
  const label = sectionLabel ?? "details";
  const message =
    EMPTY_MESSAGES[sectionId] ??
    `No ${label.toLowerCase()} have been recorded for this patient yet.`;
  const addLabel = ADD_LABELS[sectionId] ?? `Add ${label}`;
  const showCta = !NO_CTA_SECTIONS.has(sectionId);
  const showVoice = !NO_VOICE_SECTIONS.has(sectionId);

  return (
    <div className="relative flex size-full flex-col items-center justify-center gap-[16px] px-[24px] py-[40px] text-center">
      {/* File / document illustration */}
      <img
        src="/icons/dr-agent/empty-docs.svg"
        alt=""
        width={72}
        height={72}
        draggable={false}
        className="opacity-90" />

      {/* Small section-specific message */}
      <p className="max-w-[220px] font-sans text-[12px] leading-[18px] text-tp-slate-400">
        {message}
      </p>

      {/* CTAs below the text (omitted for Past Visits) */}
      {showCta ?
      <div className="w-[200px]">
        <ActionButton
          variant="stacked"
          label={addLabel}
          voiceLabel={label}
          showVoice={showVoice}
          icon="plus"
          sectionId={sectionId} />
      </div> :
      null}
    </div>);

}
