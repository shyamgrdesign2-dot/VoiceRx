/**
 * Builds a patient-specific structured consultation summary (for the
 * "Consultation Summary" chat card + auto-fill to RxPad) from the per-patient
 * mock data. Used when the doctor submits a voice consultation — instead of
 * heuristic-parsing the transcript, we surface a curated mock per patient so
 * the demo stays faithful to each patient's clinical picture.
 */

import {
  PER_PATIENT_RXPAD_DATA,
  type PatientRxPadData,
} from "@/components/rx/rxpad/per-patient-rxpad-data"
import type {
  RxPadCopyPayload,
  RxPadMedicationSeed,
} from "@/components/tp-rxpad/rxpad-sync-context"
import type {
  VoiceRxItem,
  VoiceRxSection,
  VoiceStructuredRxData,
} from "../types"

type MockRow = Record<string, string>

/**
 * Extract a display "name" from a row — handles both schemas present in
 * PER_PATIENT_RXPAD_DATA (lowercase `name` / `Symptom`, `Diagnosis`, etc.).
 */
function rowName(row: MockRow, keys: string[]): string {
  for (const k of keys) {
    if (row[k] && String(row[k]).trim()) return String(row[k]).trim()
  }
  return ""
}

/** Compose the "detail" bracket for a voice item — duration + status, etc. */
function composeDetail(row: MockRow, keys: string[]): string | undefined {
  const parts: string[] = []
  for (const k of keys) {
    const v = row[k]
    if (v && String(v).trim()) parts.push(String(v).trim())
  }
  return parts.length ? parts.join(", ") : undefined
}

function mapSymptoms(rows: MockRow[]): VoiceRxItem[] {
  return rows
    .map((r) => ({
      name: rowName(r, ["name", "Symptom", "symptom"]),
      detail: composeDetail(r, ["since", "Duration", "duration", "status", "Severity", "severity"]),
    }))
    .filter((it) => it.name)
}

function mapExaminations(rows: MockRow[]): VoiceRxItem[] {
  return rows
    .map((r) => ({
      name: rowName(r, ["name", "Examination", "examination"]),
      detail: composeDetail(r, ["Finding", "finding", "note"]),
    }))
    .filter((it) => it.name)
}

function mapDiagnoses(rows: MockRow[]): VoiceRxItem[] {
  return rows
    .map((r) => ({
      name: rowName(r, ["name", "Diagnosis", "diagnosis"]),
      detail: composeDetail(r, ["since", "Duration", "duration", "status", "Type", "type"]),
    }))
    .filter((it) => it.name)
}

function mapMedications(rows: MockRow[]): VoiceRxItem[] {
  return rows
    .map((r) => {
      const name = rowName(r, ["medicine", "Medicine"])
      if (!name) return null
      const dose = rowName(r, ["unitPerDose", "Dose"])
      const freq = rowName(r, ["frequency", "Frequency"])
      const when = rowName(r, ["when", "When"])
      const duration = rowName(r, ["duration", "Duration"])
      const parts = [dose, freq, when, duration].filter(Boolean)
      return { name, detail: parts.length ? parts.join(", ") : undefined }
    })
    .filter((it): it is VoiceRxItem => it !== null)
}

function mapAdvice(rows: MockRow[]): VoiceRxItem[] {
  return rows
    .map((r) => ({
      name: rowName(r, ["advice", "Advice"]),
      detail: rowName(r, ["note", "Note"]) || undefined,
    }))
    .filter((it) => it.name)
}

function mapLabs(rows: MockRow[]): VoiceRxItem[] {
  return rows
    .map((r) => ({
      name: rowName(r, ["investigation", "Investigation"]),
      detail: rowName(r, ["note", "Note"]) || undefined,
    }))
    .filter((it) => it.name)
}

function mapSurgeries(rows: MockRow[]): VoiceRxItem[] {
  return rows
    .map((r) => ({
      name: rowName(r, ["surgery", "Surgery"]),
      detail: rowName(r, ["note", "Note"]) || undefined,
    }))
    .filter((it) => it.name)
}

function formatVoiceItem(item: VoiceRxItem): string {
  return item.detail ? `${item.name} (${item.detail})` : item.name
}

function medToSeed(item: VoiceRxItem, row: MockRow): RxPadMedicationSeed {
  return {
    medicine: item.name,
    unitPerDose: rowName(row, ["unitPerDose", "Dose"]) || "1 tablet",
    frequency: rowName(row, ["frequency", "Frequency"]) || "1-0-1",
    when: rowName(row, ["when", "When"]) || "After Food",
    duration: rowName(row, ["duration", "Duration"]) || "5 days",
    note: rowName(row, ["note", "Note"]) || "",
  }
}

/**
 * Build the structured voice card + copy payload from a patient's mock
 * RxPad seed data. Always returns a valid shape even when some sections are
 * empty for the given patient.
 */
export function buildPatientVoiceStructuredRx(patientId: string, transcript: string): VoiceStructuredRxData {
  const data: PatientRxPadData =
    PER_PATIENT_RXPAD_DATA[patientId] ?? PER_PATIENT_RXPAD_DATA["__patient__"]

  const symptoms = mapSymptoms(data.symptoms as MockRow[])
  const examinations = mapExaminations(data.examinations as MockRow[])
  const diagnoses = mapDiagnoses(data.diagnoses as MockRow[])
  const medicationItems = mapMedications(data.medications as MockRow[])
  const advice = mapAdvice(data.advice as MockRow[])
  const labs = mapLabs(data.labs as MockRow[])
  const surgeries = mapSurgeries(data.surgeries as MockRow[])

  const sections: VoiceRxSection[] = []

  // Top half — what's clinically actionable in this consult: the
  // doctor's working set (symptoms → diagnosis → medications → advice
  // → orders → surgeries).
  if (symptoms.length) sections.push({ sectionId: "symptoms", title: "Symptoms", tpIconName: "symptom", items: symptoms })
  if (examinations.length) sections.push({ sectionId: "examination", title: "Examinations", tpIconName: "examination", items: examinations })
  if (diagnoses.length) sections.push({ sectionId: "diagnosis", title: "Diagnosis", tpIconName: "diagnosis", items: diagnoses })
  if (medicationItems.length) sections.push({ sectionId: "medication", title: "Medications", tpIconName: "medication", items: medicationItems })
  if (advice.length) sections.push({ sectionId: "advice", title: "Advice", tpIconName: "advice", items: advice })
  if (labs.length) sections.push({ sectionId: "investigation", title: "Lab investigations", tpIconName: "lab", items: labs })
  if (surgeries.length) sections.push({ sectionId: "surgery", title: "Surgeries", tpIconName: "surgery", items: surgeries })

  // Bottom half — reference data the doctor scans last (vitals + past
  // history + latest results), placed BELOW Surgery as requested so
  // the actionable consult content stays at the top of the card.
  const vitalsItems: VoiceRxItem[] = [
    // BP 138/86 is mildly above the 120/80 reference — flag high so
    // the red ↑ arrow appears in the EMR card.
    { name: "Blood pressure", detail: "138 / 86 mmHg (ref 120/80)", abnormal: "high" },
    { name: "Pulse", detail: "84 bpm (ref 60–100)" },
    { name: "Temperature", detail: "98.6 °F (ref 97–99)" },
    { name: "SpO₂", detail: "97 % (ref ≥ 95)" },
  ]
  sections.push({ sectionId: "vitals", title: "Vitals", tpIconName: "vitals", items: vitalsItems })

  const historyItems: VoiceRxItem[] = []
  if (data.additionalNotes) historyItems.push({ name: data.additionalNotes, detail: undefined })
  if (!historyItems.length) historyItems.push({ name: "No notable past history reported", detail: undefined })
  sections.push({ sectionId: "history", title: "History", tpIconName: "history", items: historyItems })

  if (labs.length) {
    // Demo: alternate first/third entries as out-of-range high/low so
    // the red ↑/↓ arrow surfaces on the Lab results section.
    sections.push({
      sectionId: "labResults",
      title: "Lab results",
      tpIconName: "lab results",
      items: labs.map((it, i) => {
        if (i === 0) return { name: it.name, detail: "Above reference range", abnormal: "high" as const }
        if (i === 2) return { name: it.name, detail: "Below reference range", abnormal: "low" as const }
        return { name: it.name, detail: "Within range" }
      }),
    })
  }

  // Follow-up may be absent for most mock patients — include only when present.
  if (data.followUpDate || data.followUpNotes) {
    const followUpName = [data.followUpDate, data.followUpNotes].filter(Boolean).join(" — ")
    sections.push({
      sectionId: "followUp",
      title: "Follow-up",
      tpIconName: "followUp",
      items: [{ name: followUpName || "Follow-up", detail: undefined }],
    })
  }

  // Build the copyAllPayload for a one-click "Fill to RxPad" action.
  const medRows = data.medications as MockRow[]
  const copyAllPayload: RxPadCopyPayload = {
    sourceDateLabel: "Voice consultation",
    symptoms: symptoms.map(formatVoiceItem),
    examinations: examinations.map(formatVoiceItem),
    diagnoses: diagnoses.map(formatVoiceItem),
    medications: medicationItems.map((m, i) => medToSeed(m, medRows[i] ?? {})),
    advice: advice.length ? advice.map((a) => a.name).join(". ") : undefined,
    labInvestigations: labs.map(formatVoiceItem),
    additionalNotes: data.additionalNotes || undefined,
    followUp: data.followUpNotes || undefined,
    followUpDate: data.followUpDate || undefined,
    followUpNotes: data.followUpNotes || undefined,
  }

  return {
    voiceText: transcript,
    sections,
    copyAllPayload,
  }
}
