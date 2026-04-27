"use client"

import {
  loadRxPreviewSnapshot,
  type RxPreviewComposedSnapshot,
  type RxPreviewSnapshot,
} from "@/components/tp-rxpad/rx-preview-store"

/**
 * Fallback sample snapshot — shown in the End Visit preview when the
 * current patient has no saved Rx yet (e.g. demo / fresh session).
 * Content is realistic enough to show the preview document fully
 * populated on every section.
 */
function buildSampleSnapshot(patientId: string): RxPreviewComposedSnapshot {
  return {
    patientId,
    updatedAt: new Date().toISOString(),
    symptoms: [
      { title: "Headache", metaParts: ["3 days", "Moderate"] },
      { title: "Nausea", metaParts: ["Occasional"] },
      { title: "Dizziness", metaParts: ["On standing"] },
    ],
    examinations: [
      { title: "Blood pressure", metaParts: ["140/90"] },
      { title: "Pulse", metaParts: ["82/min"] },
      { title: "Temperature", metaParts: ["Normal"] },
      { title: "Neurological", metaParts: ["Unremarkable"] },
    ],
    diagnoses: [
      { title: "Tension-type headache", metaParts: ["Stress-related"] },
      { title: "Essential hypertension", metaParts: ["Newly detected"] },
    ],
    labInvestigations: [
      { title: "Complete blood count (CBC)", metaParts: [] },
      { title: "Fasting blood sugar", metaParts: [] },
      { title: "Serum creatinine", metaParts: [] },
      { title: "Lipid profile", metaParts: [] },
    ],
    medications: [
      { title: "Paracetamol 500 mg", metaParts: ["SOS for headache"] },
      { title: "Telmisartan 40 mg", metaParts: ["OD morning"] },
      { title: "Pantoprazole 40 mg", metaParts: ["OD before breakfast", "7 days"] },
    ],
    advice: [
      { title: "Maintain hydration", metaParts: ["2–3 L/day"] },
      { title: "Fixed sleep schedule", metaParts: [] },
      { title: "Daily short breathing exercises", metaParts: [] },
    ],
    followUp: "1 week with lab reports and BP readings",
    additionalNotes:
      "Return earlier if headache worsens, or if any focal neurological symptoms appear.",
    vitals: [
      { label: "BP", unit: "mmHg", value: "140/90" },
      { label: "Pulse", unit: "bpm", value: "82" },
      { label: "Temp", unit: "°C", value: "36.8" },
    ],
    labResults: [],
  }
}

/**
 * Returns a ready-to-render Rx preview snapshot for the given patient.
 * Loads from localStorage when present; if nothing is saved yet the
 * preview renders an EMPTY body (just letterhead + patient details +
 * footer). Sections populate only as the user fills the RxPad — matches
 * the behaviour the user asked for: "fill that content only when I fill
 * something inside these data".
 */
export function getComposedRxPreviewSnapshot(
  patientId: string,
): RxPreviewComposedSnapshot {
  const base = loadRxPreviewSnapshot(patientId)
  if (!base) {
    return {
      patientId,
      updatedAt: new Date().toISOString(),
      symptoms: [],
      examinations: [],
      diagnoses: [],
      labInvestigations: [],
      medications: [],
      advice: [],
      vitals: [],
      labResults: [],
    }
  }
  const composed: RxPreviewComposedSnapshot = {
    ...base,
    vitals: [],
    labResults: [],
  }
  return composed
}

// Export retained only so imports don't break if a test references it.
export { buildSampleSnapshot as _buildSampleSnapshot }

/** Plain-text summary — used when saving a visit record to the patient. */
export function formatRxSnapshotSummary(
  snapshot: RxPreviewComposedSnapshot | RxPreviewSnapshot | null,
): string {
  if (!snapshot) return "No consultation details were captured on this visit."
  const lines: string[] = []
  const push = (title: string, rows: { title: string; metaParts: string[] }[]) => {
    if (!rows.length) return
    const body = rows
      .map((r) => (r.metaParts.length ? `${r.title} (${r.metaParts.join(" | ")})` : r.title))
      .join("; ")
    lines.push(`${title}: ${body}`)
  }
  push("Symptoms", snapshot.symptoms)
  push("Examination", snapshot.examinations)
  push("Diagnosis", snapshot.diagnoses)
  push("Lab investigation", snapshot.labInvestigations)
  push("Medication", snapshot.medications)
  push("Advice", snapshot.advice)
  if (snapshot.followUp?.trim()) lines.push(`Follow-up: ${snapshot.followUp.trim()}`)
  if (snapshot.additionalNotes?.trim()) lines.push(`Notes: ${snapshot.additionalNotes.trim()}`)
  return lines.join("\n") || "Visit completed — no structured Rx sections were filled."
}
