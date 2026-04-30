# Backend Integration Guide

> How to swap the demo's mock data with a real backend / agentic API
> without touching component code. Read after `engineering.md` §4 — the
> data flow diagram tells you WHERE the seams are; this file tells you
> WHAT to send and HOW to wire it.

---

## 1. The contract (TL;DR)

The frontend already speaks in stable TypeScript shapes. To plug in a
backend, you produce these shapes and feed them through the existing
hand-off points:

| Shape | Where it's consumed | Source file |
|---|---|---|
| `VoiceStructuredRxData` | The structured EMR card (canvas + chat preview) | `components/tp-rxpad/dr-agent/types.ts` |
| `RxPadCopyPayload` | The Rx form fan-out (`requestCopyToRxPad`) | `components/tp-rxpad/rxpad-sync-context.tsx` |
| `HistoricalUpdateBatch` | The sidebar fan-out (`pushHistoricalUpdates`) | `components/tp-rxpad/rxpad-sync-context.tsx` |
| `RxAgentChatMessage` | A chat bubble in the Dr.Agent panel | `components/tp-rxpad/dr-agent/types.ts` (`RxAgentChatMessage`) |

If the backend returns these directly, you skip transformation entirely.
If it returns its own shape, write a single adapter (one function per
endpoint) and the rest of the UI stays the same.

---

## 2. Endpoints the demo currently mocks

These are the calls the frontend makes today, with `setTimeout` /
hard-coded data instead of fetch. Replace each with an HTTP call.

### 2.1 `POST /voicerx/structure`

**When**: Doctor hits Submit on the recorder.

**Currently**: `DrAgentPanel.tsx:920–1020`, inside `submitVoiceRxRecording`. A `setTimeout` of ~2s, then `buildPatientVoiceStructuredRx(patientId, transcript)` returns hard-coded mock data per patient (`engines/voice-rx-patient-mock.ts`).

**Request**:
```ts
{
  patientId: string
  transcript: string                   // raw voice transcript
  mode: "ambient_consultation" | "dictation"
  durationMs: number
  contextHints?: {
    specialty?: SpecialtyTabId         // "gp" | "gynec" | ...
    visitType?: "first" | "followUp"
    patientAge?: number
    patientGender?: "M" | "F"
    activeMedications?: string[]
    activeConditions?: string[]
  }
}
```

**Response** (must satisfy `VoiceStructuredRxData`):
```ts
{
  voiceText: string                    // can be transcript or a server-cleaned version
  sections: [
    {
      sectionId: "symptoms" | "examination" | "diagnosis" | "medication" | "advice" | "investigation" | "followUp" | "history" | "vitals" | "labs"
      title: string                    // "Symptoms"
      tpIconName: string               // "virus" | "medical-service" | ... — see §6
      items: [
        { name: string, detail?: string, abnormal?: "high" | "low" }
      ]
    }
  ],
  copyAllPayload: {                    // ready-to-fan shape; see §3
    sourceDateLabel: "Voice consult",
    targetSection: "rxpad",
    symptoms?: string[],
    examinations?: string[],
    diagnoses?: string[],
    medications?: [{
      medicine: string,
      unitPerDose: string,
      frequency: string,
      when: string,
      duration: string,
      note: string
    }],
    advice?: string,
    labInvestigations?: string[],
    additionalNotes?: string,
    vitals?: { bpSystolic?, bpDiastolic?, temperature?, heartRate?, ... },
    historyChangeSummaries?: string[]
  }
}
```

**Sidebar batch**: separate from `copyAllPayload`. The frontend currently
computes it client-side via `buildVoiceConsultSidebarBatch`. Return it
alongside if the backend has stronger context:

```ts
sidebarBatch?: HistoricalUpdateBatch  // see §3 for shape
```

### 2.2 `GET /patient/:id/snapshot` (or pre-loaded with the patient)

**When**: Patient is selected; the Dr.Agent panel needs vitals, history, last visit, etc.

**Currently**: `engines/voice-rx-patient-mock.ts` and `mock-data.ts`. Hard-coded per-patient data.

**Response** would feed the various card data shapes in `types.ts`. Each card has its own `*Data` interface. Stable contracts already.

### 2.3 `POST /chat/intent`

**When**: Doctor types a free-form chat message.

**Currently**: `engines/intent-engine.ts` + `engines/reply-engine.ts` — local heuristic engines that produce a `RxAgentChatMessage` with optional `rxOutput` (a typed card payload).

**Request**:
```ts
{
  patientId: string
  text: string
  conversationHistory?: { role: "user" | "assistant", text: string, createdAt: string }[]
  contextHints?: { ... }            // same as voicerx/structure
}
```

**Response**:
```ts
{
  reply: {
    text: string                    // the assistant's text bubble
    rxOutput?: RxAgentRxOutput      // optional structured card to render under the bubble
  }
}
```

`RxAgentRxOutput` is a discriminated union over ~30 card kinds. See `types.ts` and `cards/CardRenderer.tsx`. A typical response uses one of:
- `{ kind: "voice_structured_rx", data: VoiceStructuredRxData }`
- `{ kind: "patient_reported", data: SymptomCollectorData }`
- `{ kind: "lab_panel" | "lab_trends" | "lab_comparison", data: ... }`
- `{ kind: "ddx", data: { options: [...] } }`
- `{ kind: "advice_bundle", data: { sections: [...] } }`
- `{ kind: "vitals_summary" | "vital_trends_bar" | "vital_trends_line", data: ... }`
- `{ kind: "follow_up_question", data: { questions: string[] } }` — when intent is ambiguous and the assistant needs to ask back

### 2.4 `POST /rxpad/copy/:section` (optional optimistic)

**When**: Doctor hits a Copy CTA. Currently fully client-side via `RxPadSyncContext`.

If you want server-side persistence of "what got copied" (audit trail, undo across sessions), the backend would receive the `RxPadCopyPayload` and return an id. The frontend already generates a local id (`copyId`) — replace that with the server id when the response arrives.

### 2.5 `POST /print/render`

**When**: Doctor prints. Lives at `app/print-preview/`. Currently renders client-side from local Rx state. Server-side PDF rendering would replace this route's data source.

---

## 3. Where to plug calls in (the seam map)

Code locations marked with `// TODO(integration)` would be the cleanest
labels — they don't exist yet, but the seams below are where to put
them.

### Seam A: Voice submit

**File**: `components/tp-rxpad/dr-agent/DrAgentPanel.tsx`
**Function**: `submitVoiceRxRecording` (search for it)

Replace this block:
```ts
voiceRxTimeoutRef.current = setTimeout(() => {
  const structured = buildPatientVoiceStructuredRx(selectedPatientId, transcript)
  // ... other mock builders
  setVoiceRxResult({ structured, ... })
}, 1800)
```

With:
```ts
const result = await fetch("/api/voicerx/structure", {
  method: "POST",
  body: JSON.stringify({ patientId, transcript, mode, durationMs })
}).then(r => r.json())

setVoiceRxResult({
  structured: result,
  transcript,
  sections: result.sections.map(s => ({ id: s.sectionId, title: s.title, items: s.items.map(it => it.detail ? `${it.name} — ${it.detail}` : it.name) })),
  durationMs,
  modeLabel: voiceRxDialogChoice === "ambient_consultation" ? "Conversation Mode" : "Dictation Mode",
  pendingSidebarBatch: result.sidebarBatch,
})
```

The setTimeout exists today *only* to give the shiner card time to play. If the backend is fast, keep a min-display-time wrapper so the doctor sees the loader animation:

```ts
const [serverResult, _] = await Promise.all([
  fetchStructured(...),
  new Promise(r => setTimeout(r, 1800))  // min shiner visibility
])
```

### Seam B: Chat send

**File**: `DrAgentPanel.tsx`
**Function**: `handleChatSubmit` / wherever the current `replyEngine.process(text)` lives

Replace local engine call with `fetch("/api/chat/intent", ...)`. The
response shape is already `{ reply: { text, rxOutput? } }`. Push the
assistant message into the thread; CardRenderer picks up `rxOutput`.

### Seam C: Patient context load

**File**: wherever `selectedPatientId` is set, OR a `useEffect` keyed on it
**Currently**: `mock-data.ts` is read synchronously at first render

Add an async load:
```ts
useEffect(() => {
  fetch(`/api/patient/${selectedPatientId}/snapshot`)
    .then(r => r.json())
    .then(setPatientSnapshot)
}, [selectedPatientId])
```

While loading, render the existing skeleton states (cards already handle
empty data — no errors fired).

---

## 4. Loading / empty / error matrix

The frontend has well-defined states for every card. Hand them off to
the backend via these conventions:

| State | What the UI does | What the backend should send |
|---|---|---|
| **Loading** (initial fetch) | Skeleton placeholder OR shiner card OR spinner inside the card | (don't send anything; resolve the fetch) |
| **Empty** (no data for this patient) | "No data yet" empty-state — gentle, no red | Resolve with `{ data: null }` or `204 No Content` |
| **Partial** (some sections missing) | Render available sections, omit missing ones gracefully | Send only the sections that have data; omit unknown keys |
| **Error** (network / server) | Silent fallback to empty-state UNLESS this was an explicit user action | For background loads: return empty response. For user actions: return a structured error and the UI will show an inline retry |
| **Offline** | Toast "You're offline — transcription paused"; recording continues locally | N/A — handled client-side via `useNetConnection` |

### Critical: do NOT show red banner errors mid-consultation

The doctor is mid-consult with a real patient. A red "Server error 500"
banner is the worst possible UX. Default behavior:

- Background loads (patient snapshot, side-panel data) → fail silently, fall back to empty-state
- Submit actions (voice / chat / copy) → inline retry button, no banner
- Critical actions (save / print) → only place a modal error is acceptable, and only with a clear next step

This is the single biggest UX rule — the existing code holds to it; the
backend integration must too.

---

## 5. Authentication

Not implemented in the demo. When you add it:

- Token storage: prefer `httpOnly` cookies over `localStorage`
- 401 handling: redirect to login or trigger re-auth flow; do NOT show the doctor a red error
- Token refresh: silent in the background; only surface if refresh truly fails

Add an `apiClient` wrapper (one new file, `lib/api-client.ts`) that injects auth headers and handles 401 retry. Every fetch call goes through it.

---

## 6. Icon mapping

The backend's `tpIconName` field must match an icon the frontend knows
about. The lookup is in `components/tp-ui/TPMedicalIcon.tsx`. Common
section icons:

| sectionId | tpIconName |
|---|---|
| `symptoms` | `virus` |
| `examination` | `medical-service` |
| `diagnosis` | `Diagnosis` |
| `medication` | `pill` or `tablets` |
| `advice` | `health-care` |
| `investigation` / `lab` | `Lab` |
| `followUp` | `calendar` |
| `history` | `medical-record` |
| `vitals` | `heart-rate` |
| `labs` (results) | `test-tube` |
| `surgeries` | `surgical-scissors-02` |

If you add new section types, add an icon (SVG file under `public/icons/medical/`) and register it.

---

## 7. Sample wire payloads

### Voice submit response (a real-ish one)

```json
{
  "voiceText": "Patient complains of fever and cough for 3 days...",
  "sections": [
    {
      "sectionId": "symptoms",
      "title": "Symptoms",
      "tpIconName": "virus",
      "items": [
        { "name": "Fever", "detail": "3 days, moderate" },
        { "name": "Cough", "detail": "3 days, dry" }
      ]
    },
    {
      "sectionId": "diagnosis",
      "title": "Diagnosis",
      "tpIconName": "Diagnosis",
      "items": [{ "name": "Viral pharyngitis", "detail": "suspected" }]
    },
    {
      "sectionId": "medication",
      "title": "Medications",
      "tpIconName": "tablets",
      "items": [
        { "name": "Paracetamol 650mg", "detail": "1 tablet, 1-0-0-1, AF, 3 days" }
      ]
    }
  ],
  "copyAllPayload": {
    "sourceDateLabel": "Voice consult",
    "targetSection": "rxpad",
    "symptoms": ["Fever (3 days, moderate)", "Cough (3 days, dry)"],
    "diagnoses": ["Viral pharyngitis (suspected)"],
    "medications": [
      {
        "medicine": "Paracetamol 650mg",
        "unitPerDose": "1 tablet",
        "frequency": "1-0-0-1",
        "when": "AF",
        "duration": "3 days",
        "note": ""
      }
    ]
  },
  "sidebarBatch": {
    "vitals": [
      { "id": "v1", "bullets": ["Temp 99.8°F", "Pulse 88 bpm"] }
    ]
  }
}
```

### Chat reply response

```json
{
  "reply": {
    "text": "Based on the labs, hemoglobin is below range. Want me to suggest a workup?",
    "rxOutput": {
      "kind": "lab_panel",
      "data": {
        "title": "CBC — 12 Mar 2026",
        "category": "haematology",
        "parameters": [
          { "name": "Hb", "value": "9.2 g/dL", "refRange": "13.0–17.0", "flag": "low" }
        ],
        "normalCount": 5,
        "insight": "Mild anemia — consider iron studies"
      }
    }
  }
}
```

---

## 8. Migration checklist

For the team integrating:

- [ ] Stand up the API endpoints listed in §2
- [ ] Match response shapes to `types.ts` interfaces (or write adapters)
- [ ] Add `lib/api-client.ts` with auth + retry
- [ ] Replace seams A/B/C in `DrAgentPanel.tsx` (engineering.md §4)
- [ ] Verify the loading / empty / error contract — no red banners
- [ ] Test offline behaviour (DevTools → Network → Offline)
- [ ] Test 401 / 500 paths — silent fallback to empty
- [ ] Test partial-data response — sections render only what's there
- [ ] Test patient switch mid-action — abort in-flight fetch
- [ ] Audit logging — every Copy CTA fires an event you can persist

When this is done, every component above the seam stays untouched.
That's the test that the contracts hold.
