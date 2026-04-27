"use client"

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react"

import type { NavItemId } from "@/components/tp-rxpad/secondary-sidebar/types"

export interface RxPadMedicationSeed {
  medicine: string
  unitPerDose: string
  frequency: string
  when: string
  duration: string
  note: string
}

export interface RxPadVitalsSeed {
  bpSystolic?: string
  bpDiastolic?: string
  temperature?: string
  heartRate?: string
  respiratoryRate?: string
  weight?: string
  surgeryProcedure?: string
}

export interface RxPadCopyPayload {
  sourceDateLabel: string
  targetSection?:
    | "rxpad"
    | "vitals"
    | "history"
    | "ophthal"
    | "gynec"
    | "obstetric"
    | "vaccine"
    | "growth"
    | "labResults"
    | "medicalRecords"
    | "followUp"
  symptoms?: string[]
  examinations?: string[]
  diagnoses?: string[]
  medications?: RxPadMedicationSeed[]
  advice?: string
  followUp?: string
  followUpDate?: string
  followUpNotes?: string
  labInvestigations?: string[]
  additionalNotes?: string
  vitals?: RxPadVitalsSeed
  /** Human-readable history deltas, e.g. "Type 2 diabetes: Active → Inactive" (sidebar highlight). */
  historyChangeSummaries?: string[]
}

export interface RxPadCopyRequest {
  id: number
  payload: RxPadCopyPayload
}

/** One batch of lines synced into a historical sidebar section (from RxPad or sidebar edits). */
export interface HistoricalUpdateChunk {
  id: string
  at: number
  bullets: string[]
  /** Highlighted in the panel until the user opens this section. */
  isFresh: boolean
  /** Present when this chunk came from {@link requestCopyToRxPad} — enables undo. */
  sourceCopyId?: number
  undoPayload?: RxPadCopyPayload
}

export interface RxPadUndoRequest {
  id: number
  sourceCopyId: number
  payload: RxPadCopyPayload
}

/** Input shape for {@link pushHistoricalUpdates}. */
export type HistoricalUpdateBatch = Partial<
  Record<
    NavItemId,
    {
      id: string
      bullets: string[]
      sourceCopyId?: number
      undoPayload?: RxPadCopyPayload
    }[]
  >
>

export type HistoricalUpdatesState = Partial<Record<NavItemId, HistoricalUpdateChunk[]>>

export interface RxPadSignal {
  id: number
  type:
    | "symptoms_changed"
    | "medications_changed"
    | "diagnosis_changed"
    | "examination_changed"
    | "advice_changed"
    | "lab_investigation_changed"
    | "section_focus"
    | "sidebar_pill_tap"
    | "ai_trigger"
  label?: string
  count?: number
  sectionId?: string
  contextPayload?: string
}

interface RxPadSyncContextValue {
  lastCopyRequest: RxPadCopyRequest | null
  lastSignal: RxPadSignal | null
  requestCopyToRxPad: (payload: RxPadCopyPayload) => void
  publishSignal: (signal: Omit<RxPadSignal, "id">) => void
  /** Current patient's known allergies (drug + other), set by DrAgentPanel */
  patientAllergies: string[]
  setPatientAllergies: (allergies: string[]) => void
  /** True while VoiceRx structured response is being generated — RxPad blocks edits & shows overlay. */
  aiFillInProgress: boolean
  setAiFillInProgress: (v: boolean) => void
  /** True while a voice consultation is actively recording — RxPad actions become read-only. */
  voiceActive: boolean
  setVoiceActive: (v: boolean) => void
  /** True for ~2s after the doctor hits "Copy all to RxPad". Used by
   *  VoiceRxFlow to flash the live edge aura around the whole RxPad
   *  (instead of pulsing every individual module ring) so the doctor
   *  sees a single coordinated "Rx just got filled" affordance. */
  copyAllAuraActive: boolean
  flashCopyAllAura: () => void
  /** True while a "copying to RxPad" overlay is showing — backdrop blur
   *  + edge aura + caption — before the actual fill fires. Set by
   *  {@link runCopyWithAura}. */
  copyOverlayActive: boolean
  /** Show the copy overlay for ~2.5s, then fire requestCopyToRxPad with
   *  the given payload(s). Use this anywhere a doctor presses a copy /
   *  "fill to RxPad" affordance so the action reads as a deliberate
   *  AI-mediated transfer rather than an instant clipboard write. */
  runCopyWithAura: (
    payload: RxPadCopyPayload | RxPadCopyPayload[],
    opts?: { bulk?: boolean; delayMs?: number },
  ) => void
  /** Label of the module (or sidebar section) currently running an inline
   *  voice recorder, or null when none is active. Used by VoiceRxFlow to
   *  extend the global voice-lock + tooltip to the module-level flow and
   *  by sibling modules to disable their own triggers. */
  activeVoiceModule: string | null
  setActiveVoiceModule: (label: string | null) => void
  /** Sidebar sections with unseen RxPad / sync updates (red dot on rail). */
  historicalUpdates: HistoricalUpdatesState
  isHistoricalSectionUnseen: (id: NavItemId) => boolean
  /** Merge new highlight chunks (e.g. from {@link buildHistoricalUpdatesFromPayload}). */
  pushHistoricalUpdates: (batch: HistoricalUpdateBatch) => void
  /** When user opens a sidebar section — clears red dot only (banner stays highlighted). */
  acknowledgeHistoricalSection: (id: NavItemId) => void
  /** Collapse strong “new” styling after the user reads the banner. */
  dismissHistoricalHighlights: (id: NavItemId) => void
  /** Remove one highlight card (e.g. user dismissed a single sync). */
  removeHistoricalChunk: (sectionId: NavItemId, chunkId: string) => void
  /** Revert RxPad mutations from a copy batch and drop matching sidebar chunks. */
  lastUndoRequest: RxPadUndoRequest | null
  requestUndoRxPadSync: (sourceCopyId: number, payload: RxPadCopyPayload) => void
  removeHistoricalChunksBySourceCopyId: (sourceCopyId: number) => void
  /** Record edits made inside a historical panel (forms, quick-add, etc.). */
  recordHistoricalSidebarEdit: (id: NavItemId, bullets: string[]) => void
}

const RxPadSyncContext = createContext<RxPadSyncContextValue>({
  lastCopyRequest: null,
  lastSignal: null,
  requestCopyToRxPad: () => {},
  publishSignal: () => {},
  patientAllergies: [],
  setPatientAllergies: () => {},
  aiFillInProgress: false,
  setAiFillInProgress: () => {},
  voiceActive: false,
  copyAllAuraActive: false,
  flashCopyAllAura: () => {},
  copyOverlayActive: false,
  runCopyWithAura: () => {},
  setVoiceActive: () => {},
  activeVoiceModule: null,
  setActiveVoiceModule: () => {},
  historicalUpdates: {},
  isHistoricalSectionUnseen: () => false,
  pushHistoricalUpdates: () => {},
  acknowledgeHistoricalSection: () => {},
  dismissHistoricalHighlights: () => {},
  removeHistoricalChunk: () => {},
  lastUndoRequest: null,
  requestUndoRxPadSync: () => {},
  removeHistoricalChunksBySourceCopyId: () => {},
  recordHistoricalSidebarEdit: () => {},
})

export function RxPadSyncProvider({ children }: { children: React.ReactNode }) {
  const [lastCopyRequest, setLastCopyRequest] = useState<RxPadCopyRequest | null>(null)
  const [lastSignal, setLastSignal] = useState<RxPadSignal | null>(null)
  const [copySequence, setCopySequence] = useState(0)
  const [signalSequence, setSignalSequence] = useState(0)
  const [patientAllergies, setPatientAllergies] = useState<string[]>([])
  const [aiFillInProgress, setAiFillInProgress] = useState(false)
  const [voiceActive, setVoiceActive] = useState(false)
  const [copyAllAuraActive, setCopyAllAuraActive] = useState(false)
  const copyAllAuraTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const flashCopyAllAura = useCallback(() => {
    setCopyAllAuraActive(true)
    if (copyAllAuraTimerRef.current) clearTimeout(copyAllAuraTimerRef.current)
    copyAllAuraTimerRef.current = setTimeout(() => setCopyAllAuraActive(false), 2000)
  }, [])
  const [copyOverlayActive, setCopyOverlayActive] = useState(false)
  const copyOverlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [activeVoiceModule, setActiveVoiceModule] = useState<string | null>(null)
  const [historicalUpdates, setHistoricalUpdates] = useState<HistoricalUpdatesState>({})
  const [historicalUnseen, setHistoricalUnseen] = useState<Partial<Record<NavItemId, boolean>>>({})
  const [lastUndoRequest, setLastUndoRequest] = useState<RxPadUndoRequest | null>(null)
  const undoSeqRef = useRef(0)

  const isHistoricalSectionUnseen = useCallback(
    (id: NavItemId) => !!historicalUnseen[id],
    [historicalUnseen],
  )

  const pushHistoricalUpdates = useCallback((batch: HistoricalUpdateBatch) => {
      const now = Date.now()
      setHistoricalUpdates((prev) => {
        const next: HistoricalUpdatesState = { ...prev }
        for (const k of Object.keys(batch) as NavItemId[]) {
          const chunks = batch[k]
          if (!chunks?.length) continue
          const add: HistoricalUpdateChunk[] = chunks.map((c) => ({
            id: c.id,
            bullets: c.bullets,
            at: now,
            isFresh: true,
            sourceCopyId: c.sourceCopyId,
            undoPayload: c.undoPayload,
          }))
          next[k] = [...(next[k] ?? []), ...add].slice(-24)
        }
        return next
      })
      setHistoricalUnseen((prev) => {
        const n = { ...prev }
        for (const k of Object.keys(batch) as NavItemId[]) {
          if (batch[k]?.length) n[k] = true
        }
        return n
      })
    },
    [],
  )

  const acknowledgeHistoricalSection = useCallback((id: NavItemId) => {
    setHistoricalUnseen((prev) => ({ ...prev, [id]: false }))
  }, [])

  const dismissHistoricalHighlights = useCallback((id: NavItemId) => {
    setHistoricalUpdates((prev) => ({
      ...prev,
      [id]: (prev[id] ?? []).map((c) => ({ ...c, isFresh: false })),
    }))
  }, [])

  const removeHistoricalChunk = useCallback((sectionId: NavItemId, chunkId: string) => {
    setHistoricalUpdates((prev) => ({
      ...prev,
      [sectionId]: (prev[sectionId] ?? []).filter((c) => c.id !== chunkId),
    }))
  }, [])

  const removeHistoricalChunksBySourceCopyId = useCallback((sourceCopyId: number) => {
    setHistoricalUpdates((prev) => {
      const next: HistoricalUpdatesState = { ...prev }
      for (const k of Object.keys(next) as NavItemId[]) {
        next[k] = (next[k] ?? []).filter((c) => c.sourceCopyId !== sourceCopyId)
      }
      return next
    })
  }, [])

  const requestUndoRxPadSync = useCallback((sourceCopyId: number, payload: RxPadCopyPayload) => {
    undoSeqRef.current += 1
    setLastUndoRequest({ id: undoSeqRef.current, sourceCopyId, payload })
  }, [])

  const recordHistoricalSidebarEdit = useCallback(
    (id: NavItemId, bullets: string[]) => {
      const trimmed = bullets.map((s) => s.trim()).filter(Boolean)
      if (!trimmed.length) return
      pushHistoricalUpdates({
        [id]: [{ id: `sidebar-${Date.now()}`, bullets: trimmed }],
      })
    },
    [pushHistoricalUpdates],
  )

  const requestCopyToRxPad = useCallback((payload: RxPadCopyPayload) => {
    setCopySequence((prev) => {
      const next = prev + 1
      setLastCopyRequest({ id: next, payload })
      return next
    })
  }, [])

  const runCopyWithAura = useCallback(
    (
      payload: RxPadCopyPayload | RxPadCopyPayload[],
      opts?: { bulk?: boolean; delayMs?: number },
    ) => {
      // Edge-gradient-only treatment — no backdrop blur, no caption.
      // The aura fires for ~2s; the actual fill lands halfway through
      // so the doctor sees the gradient activate, then the data appear.
      // For BULK ("Copy all to RxPad") we also raise copyAllAuraActive
      // so per-module pulses are suppressed (the edge rim becomes the
      // single coordinated signal). For SINGLE-ITEM / per-section
      // copies we leave it false — RxPadFunctional then runs its
      // per-module flash + scroll-into-view as usual.
      const delayMs = opts?.delayMs ?? 2000
      const bulk = !!opts?.bulk
      setCopyOverlayActive(true)
      if (bulk) setCopyAllAuraActive(true)
      if (copyOverlayTimerRef.current) clearTimeout(copyOverlayTimerRef.current)
      if (copyAllAuraTimerRef.current) clearTimeout(copyAllAuraTimerRef.current)
      // Fire the actual fill at the midpoint so the gradient frames
      // the moment data lands.
      const fillAt = Math.max(200, Math.round(delayMs * 0.45))
      window.setTimeout(() => {
        const payloads = Array.isArray(payload) ? payload : [payload]
        for (const p of payloads) {
          setCopySequence((prev) => {
            const next = prev + 1
            setLastCopyRequest({ id: next, payload: p })
            return next
          })
        }
      }, fillAt)
      copyOverlayTimerRef.current = setTimeout(() => setCopyOverlayActive(false), delayMs)
      if (bulk) {
        copyAllAuraTimerRef.current = setTimeout(() => setCopyAllAuraActive(false), delayMs)
      }
    },
    [],
  )

  const publishSignal = useCallback((signal: Omit<RxPadSignal, "id">) => {
    setSignalSequence((prev) => {
      const next = prev + 1
      setLastSignal({ id: next, ...signal })
      return next
    })
  }, [])

  const value = useMemo(
    () => ({
      lastCopyRequest,
      lastSignal,
      requestCopyToRxPad,
      publishSignal,
      patientAllergies,
      setPatientAllergies,
      aiFillInProgress,
      setAiFillInProgress,
      voiceActive,
      setVoiceActive,
      copyAllAuraActive,
      flashCopyAllAura,
      copyOverlayActive,
      runCopyWithAura,
      activeVoiceModule,
      setActiveVoiceModule,
      historicalUpdates,
      isHistoricalSectionUnseen,
      pushHistoricalUpdates,
      acknowledgeHistoricalSection,
      dismissHistoricalHighlights,
      removeHistoricalChunk,
      lastUndoRequest,
      requestUndoRxPadSync,
      removeHistoricalChunksBySourceCopyId,
      recordHistoricalSidebarEdit,
    }),
    [
      lastCopyRequest,
      lastSignal,
      requestCopyToRxPad,
      publishSignal,
      patientAllergies,
      aiFillInProgress,
      voiceActive,
      copyAllAuraActive,
      flashCopyAllAura,
      copyOverlayActive,
      runCopyWithAura,
      activeVoiceModule,
      historicalUpdates,
      isHistoricalSectionUnseen,
      pushHistoricalUpdates,
      acknowledgeHistoricalSection,
      dismissHistoricalHighlights,
      removeHistoricalChunk,
      lastUndoRequest,
      requestUndoRxPadSync,
      removeHistoricalChunksBySourceCopyId,
      recordHistoricalSidebarEdit,
    ],
  )

  return <RxPadSyncContext.Provider value={value}>{children}</RxPadSyncContext.Provider>
}

export function useRxPadSync() {
  return useContext(RxPadSyncContext)
}
