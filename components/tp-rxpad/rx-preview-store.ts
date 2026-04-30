/**
 * Rx preview store — localStorage-backed snapshot of the current patient's
 * Rx body. Mirrors the dental-model shape (components/tp-rxpad/
 * rx-preview-store.ts) so the End Visit preview / sidebar can render the
 * same document regardless of which surface saved it.
 */

export interface RxPreviewLine {
  title: string
  metaParts: string[]
}

export interface RxPreviewSnapshot {
  patientId: string
  updatedAt: string
  symptoms: RxPreviewLine[]
  examinations: RxPreviewLine[]
  diagnoses: RxPreviewLine[]
  labInvestigations: RxPreviewLine[]
  medications: RxPreviewLine[]
  advice: RxPreviewLine[]
  followUp?: string
  additionalNotes?: string
}

export interface RxPreviewVitalRow {
  label: string
  unit: string
  value: string
}

export interface RxPreviewLabRow {
  label: string
  unit: string
  value: string
  abnormal?: boolean
}

export interface RxPreviewComposedSnapshot extends RxPreviewSnapshot {
  vitals: RxPreviewVitalRow[]
  labResults: RxPreviewLabRow[]
}

const STORAGE_PREFIX = "tp-rx-preview:"

function getStorageKey(patientId: string) {
  return `${STORAGE_PREFIX}${patientId || "__patient__"}`
}

export function saveRxPreviewSnapshot(patientId: string, snapshot: RxPreviewSnapshot) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(getStorageKey(patientId), JSON.stringify(snapshot))
}

export function loadRxPreviewSnapshot(patientId: string): RxPreviewSnapshot | null {
  if (typeof window === "undefined") return null
  const raw = window.localStorage.getItem(getStorageKey(patientId))
  if (!raw) return null
  try {
    return JSON.parse(raw) as RxPreviewSnapshot
  } catch {
    return null
  }
}
