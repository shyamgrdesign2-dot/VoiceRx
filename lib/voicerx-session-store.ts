// localStorage-backed store for VoiceRx consultation sessions.
// Each session captures the doctor's submitted transcript plus the
// generated TP-EMR sections and clinical-notes HTML so the doctor can
// re-open prior sessions from the chat and continue editing / printing.

const KEY = "voicerx.sessions.v1"

export type EmrSection = {
  id: string
  title: string
  items: string[]
}

export type Feedback = "up" | "down" | null

export type VoiceRxSession = {
  id: string
  patientId: string
  patientName?: string
  startedAt: string // ISO
  durationMs: number
  transcript: string
  audioQuality?: "good" | "fair" | "poor"
  emrSections: EmrSection[]
  clinicalNotesHtml: string
  feedback: {
    transcript: Feedback
    emr: Feedback
    clinical: Feedback
  }
}

function read(): VoiceRxSession[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function write(list: VoiceRxSession[]) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list))
  } catch { /* ignore quota errors */ }
}

export function listSessions(patientId?: string): VoiceRxSession[] {
  const all = read().sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1))
  return patientId ? all.filter((s) => s.patientId === patientId) : all
}

export function getSession(id: string): VoiceRxSession | null {
  return read().find((s) => s.id === id) ?? null
}

export function saveSession(session: VoiceRxSession) {
  const list = read().filter((s) => s.id !== session.id)
  list.push(session)
  write(list)
}

export function updateSession(id: string, patch: Partial<VoiceRxSession>) {
  const list = read()
  const idx = list.findIndex((s) => s.id === id)
  if (idx === -1) return
  list[idx] = { ...list[idx], ...patch }
  write(list)
}

export function deleteSession(id: string) {
  write(read().filter((s) => s.id !== id))
}
