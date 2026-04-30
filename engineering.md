# Engineering Reference

> How TatvaPractice (Dr.Agent / VoiceRx / RxPad) is wired. Read this
> alongside `design.md` (visual contract) and `integration.md` (backend
> hand-off).

---

## 1. Stack

- **Framework**: Next.js 16, App Router, Turbopack
- **Language**: TypeScript (strict)
- **Styling**: Tailwind CSS + custom TP design tokens, scoped `<style>` blocks for keyframe animations
- **State**: React local state + a few Context providers; no Redux / Zustand. Mock data lives in `engines/`
- **Audio**: Web Speech API (live transcript) + `MediaStream` analyser (waveform). No third-party recorder library.
- **Animation**: `framer-motion` (`motion`) for staged transitions, CSS keyframes for everything else.
- **Icons**: `iconsax-reactjs` (primary), `lucide-react` (utility), inline SVGs for solid-style custom glyphs.

---

## 2. Surface map

The product is one Next.js app with several "surfaces". Routes live under `app/`:

| Route | Surface | Entry component |
|---|---|---|
| `/invisit` | Doctor's "in-visit" workspace — chat + RxPad + sidebar | `app/invisit/page.tsx` → `RxPadFloatingAgent` (full layout) and `DrAgentPanel` (chat panel) |
| `/rxpad` | Standalone RxPad page | `RxPadFunctional` |
| `/patient-details` | Patient profile + history | `PatientDetailsPage` |
| `/print-preview` | Print-ready Rx | `PrintPreviewPage` |
| `/(docs)/*` | Internal design-system showcases — **not for production** | `app/(docs)/...` |

The "Dr.Agent panel" lives inside `/invisit` and `/patient-details`. It's the chat + voice-rx flow surface.

---

## 3. Component hierarchy (the bits that matter)

```
RxPadFloatingAgent (top-level workspace shell)
├── TPRxPadShell
│   └── VoiceRxFlowInner
│       └── RxPadSyncProvider  ←  context: copy-to-rxpad data bus
│           ├── DrAgentPanel  ←  the chat / voice-rx panel
│           │   ├── 3D flip card
│           │   │   ├── FRONT FACE: ChatThread + ChatInput
│           │   │   └── BACK FACE:
│           │   │       ├── VoiceRxActiveAgent  (recording)
│           │   │       ├── VoiceTranscriptProcessingCard  (post-submit shiner)
│           │   │       └── VoiceRxCanvas  (review surface)
│           │   │           └── VoiceStructuredRxCard  (the structured EMR card, hideHeader=true)
│           │   ├── Cards (chat bubbles render via CardRenderer → CardShell)
│           │   └── shell: AgentHeader, PatientSelector, SessionHistoryDrawer, FeedbackBottomSheet
│           ├── RxPadFunctional  (the Rx form)
│           └── secondary-sidebar (vitals/history/labs/etc)
```

### Key entry points
- **`components/tp-rxpad/dr-agent/DrAgentPanel.tsx`** (~2400 LOC) — owns the chat thread, voice-rx state machine, and panel chrome. The "brain" of the assistant panel.
- **`components/tp-rxpad/RxPadFloatingAgent.tsx`** (~8700 LOC) — the in-visit workspace shell. Includes the legacy v0 `PatientReportedCard` (different visual language from the dr-agent one).
- **`components/voicerx/VoiceRxActiveAgent.tsx`** (~1500 LOC) — the recorder UI: mode pill, live transcript, mic / mute / device picker, submit / cancel.
- **`components/voicerx/VoiceRxCanvas.tsx`** — the post-submit review surface. Wraps `VoiceStructuredRxCard(hideHeader=true)` plus chrome + footer CTAs.
- **`components/tp-rxpad/dr-agent/cards/CardShell.tsx`** — the canonical card chrome. Every dr-agent card uses this.
- **`components/tp-rxpad/rxpad-sync-context.tsx`** — the copy-to-RxPad data bus. The seam where chat / voice-rx hand structured data to the Rx form.

---

## 4. Data flow — voice consultation, end to end

```
[1] Doctor taps "Start with Voice"
        │
        ▼
[2] DrAgentPanel.startVoiceRx()
        │  state: voiceRxRecording = true; flips 3D card to back face
        ▼
[3] VoiceRxActiveAgent mounts
        │  hooks: useMicStream → getUserMedia → MediaStream
        │         useLiveTranscript → Web Speech API → live text
        │         VoiceRxSiriWaveform → AudioContext analyser
        ▼
[4] Doctor speaks; transcript streams; waveform pulses
        │
        ▼
[5] Doctor hits Submit
        │  state: voiceRxAwaitingResponse = true
        ▼
[6] submitVoiceRxRecording():
        │   • Echoes a chat bubble (user role) with the transcript
        │   • setTimeout(simulated processing delay)  ← THIS IS THE BACKEND SEAM
        │   • Calls buildPatientVoiceStructuredRx(patientId, transcript)
        │     [returns VoiceStructuredRxData — see §5]
        │   • Builds buildVoiceConsultSidebarBatch(...)
        │     [vitals/history sidebar updates — DEFERRED, not applied yet]
        │   • Pushes assistant chat bubble with rxOutput.kind = "voice_structured_rx"
        │   • setVoiceRxResult({ structured, transcript, sections, pendingSidebarBatch, ... })
        ▼
[7] DrAgentPanel renders VoiceRxCanvas (back face stays flipped)
        │   The doctor reviews the structured clinical notes.
        ▼
[8a] Doctor hits "Copy all to EMR"
        │   • runCopyWithAura(structured.copyAllPayload, { bulk: true })
        │     → fans out to the RxPad form via rxpad-sync-context
        │   • If pendingSidebarBatch exists: pushHistoricalUpdates(it)
        │     → fans out to the secondary sidebar (vitals/history/etc)
        │   • Doctor sees auras animate on the filled fields
        │
[8b] Doctor hits "Quick Edit"
        │   • Clears canvas, restarts a recording session
        │   (Phase 2: will mount inline recorder above canvas instead)
        │
[8c] Doctor hits Back
        │   • setVoiceRxResultMinimized(true) — flips card back to chat
        │   • Chat shows minimal preview card (VoiceStructuredRxCard, hideHeader=false)
        │   • Tap expand → reopens the canvas with full state preserved
```

**The backend seam is step [6]**: replace the setTimeout + mock builders with an HTTP call. See `integration.md` §3.

---

## 5. Core data shapes

All defined in `components/tp-rxpad/dr-agent/types.ts` and `components/tp-rxpad/rxpad-sync-context.tsx`. Quick reference:

### `VoiceStructuredRxData` — what comes out of voice processing
```ts
interface VoiceStructuredRxData {
  voiceText: string                    // raw transcript
  sections: VoiceRxSection[]           // structured sections
  copyAllPayload: RxPadCopyPayload     // shape ready to fan into the Rx form
}

interface VoiceRxSection {
  sectionId: "symptoms" | "examination" | "diagnosis" | "medication" | "advice" | "investigation" | "followUp" | "history" | "vitals" | "labs"
  title: string
  tpIconName: string                   // matches a TPMedicalIcon name
  items: VoiceRxItem[]
}

interface VoiceRxItem {
  name: string                         // "Paracetamol 650mg"
  detail?: string                      // "1 tablet, 1-0-0-1, AF, 3 days"
  abnormal?: "high" | "low"            // for vitals/labs
}
```

### `RxPadCopyPayload` — the fan-out shape
```ts
interface RxPadCopyPayload {
  sourceDateLabel: string              // "Voice consult" / "Patient intake" / "Lab report 12 Mar"
  targetSection?: NavItemId            // which Rx section / sidebar tab to fill
  symptoms?: string[]
  examinations?: string[]
  diagnoses?: string[]
  medications?: RxPadMedicationSeed[]
  advice?: string
  followUp?: string
  labInvestigations?: string[]
  additionalNotes?: string
  vitals?: RxPadVitalsSeed
  historyChangeSummaries?: string[]
}
```

### `HistoricalUpdateBatch` — the sidebar fan-out shape
```ts
type HistoricalUpdateBatch = Partial<Record<NavItemId, {
  id: string
  bullets: string[]
  sourceCopyId?: number
  undoPayload?: RxPadCopyPayload
}[]>>
```

These three shapes are **the entire contract** between any data source (voice, OCR, manual chat, agentic API) and the Rx form. If you can produce these, you can plug into the existing fan-out machinery without touching component code.

---

## 6. State management

### Local component state
The default. `useState` / `useReducer` for everything.

### Context providers (use sparingly)
- **`RxPadSyncContext`** (`components/tp-rxpad/rxpad-sync-context.tsx`) — the cross-cutting bus. Provides:
  - `requestCopyToRxPad(payload)` — fire-and-forget; the Rx form subscribes
  - `runCopyWithAura(payload, { bulk })` — same but with the visual aura animation
  - `pushHistoricalUpdates(batch)` — fan-out to the sidebar
  - `signals$`, `copyAllAuraActive`, `ungroundedRowIds`, `groundRow` — visual sync hooks
  - **This is the seam for backend ingest**: any new data source calls `requestCopyToRxPad` and the form picks it up

### What does NOT use Context
- Voice recording state (lives in `DrAgentPanel`)
- Chat messages (lives in `DrAgentPanel`)
- Card rendering (props-only)
- Mode pills, headers, footers (props-only)

This is intentional — the surfaces are easy to test and reuse if they don't reach into context.

---

## 7. Componentization map — what's reusable, what's NOT

### Highly reusable (drop-in)
- `CardShell` — every card chrome
- `CopyIcon`, `CopyTooltip` — the copy affordance
- `SectionSummaryBar` — section header bar
- `ActionableTooltip` — touch-aware tooltip with action confirm
- `TPMedicalIcon` — medical-domain icons via mask-image
- `VoiceRxIcon` — the brand voice glyph
- `VoiceRxSiriWaveform` — feeds on a MediaStream prop, otherwise idles
- `useNetConnection`, `useTouchDevice` — environment hooks

### Reusable with a wrapper
- `VoiceStructuredRxCard` — rendered with `hideHeader=true` inside the canvas, `hideHeader=false` in chat
- `VoiceRxActiveAgent` — stateless-ish; the only state it owns is mute / device picker
- `VoiceRxCanvas` — pure shell; takes `emrCard` as a slot prop

### Not yet componentized (engineering opportunities)
- The footer **Copy CTA** (secondary outline) is duplicated between `PatientReportedCard.tsx` and `VoiceStructuredRxCard.tsx` — extract to `<CopyAllToRxButton variant="primary" | "secondary" />` in `components/tp-rxpad/dr-agent/cards/`.
- The naked icon button pattern (`bg-transparent`, hover color change, 16px SVG) is repeated across `VoiceRxActiveAgent` and `VoiceRxCanvas`. Extract to `<NakedIconButton>`.
- The mode pill (recorder + canvas) is duplicated chrome. Extract to `<ModePill back kebab dropdown>{label}</ModePill>`.
- The amber heads-up coachmark is inlined in `VoiceRxCanvas`. Extract to `<HeadsUpCallout id title body />` so any surface can show one.
- `DrAgentPanel.tsx` is 2.4kLOC. Worth splitting:
  - `useVoiceRxFlow()` hook — owns the recording state machine
  - `useChatThread(patientId)` hook — owns messages
  - `<DrAgentPanelChat />`, `<DrAgentPanelVoiceBack />` — front/back face split

These are NOT urgent — the existing surfaces work — but they reduce the cognitive load on anyone touching `DrAgentPanel` next.

---

## 8. Edge cases / silent error handling

The canonical principle from `design.md`: **pre-clinical errors are silent**. The doctor should not see network or mic-permission red banners during a real consultation.

| Condition | Current behaviour | Notes |
|---|---|---|
| Mic permission denied | Inline empty-state inside the recorder ("Allow microphone access" CTA → re-triggers `getUserMedia`). Submit button disabled until resolved. | `VoiceRxActiveAgent.tsx:407` |
| Mic supported but unplugged / silent | Waveform shows idle line. No error. Transcript empty → submit is no-op (returns to idle). | `VoiceRxActiveAgent.tsx` `useMicStream` |
| Web Speech API unsupported | Falls back to a scripted demo transcript on submit (the hard-coded `VOICE_RX_AMBIENT_CHUNKS`). Real backend will replace this. | `DrAgentPanel.tsx:921` |
| Offline / network slow | `NetSpeedChip` shows a toast (`toast.error("You're offline — transcription paused")`); recording continues; submit reconnects when back online. | `components/voicerx/NetSpeedChip.tsx` |
| Doctor switches patients mid-recording | `cancelVoiceRxRecording()` runs; transcript discarded; chat thread per-patient. | Messages keyed by `selectedPatientId`. |
| Doctor minimizes panel mid-recording | Recording continues in the background; pulse on the floating chip indicates active session. |  |
| Doctor hits Back from canvas | State preserved (`voiceRxResultMinimized=true`). Re-expand restores the canvas + scroll position. |  |

### What does NOT exist yet (gaps the backend team should plan for)
- Retry of a failed `/structure` call (currently no failure path — setTimeout always succeeds)
- Partial-section results (currently the canvas assumes all sections come at once)
- Streaming transcript from server (currently Web Speech API only)
- Auth / token expiry (no auth in the demo)

---

## 9. File hygiene — the cleanup state

Done in this pass:
- `tmp/voicerx-fab-ref/` removed (156KB, zero imports)
- Dead CSS classes (`vrx-cn-back`, `vrx-cn-glossy`, `vrx-mode-heading-back`, `vrx-agent-glossy-btn`) removed from `<style>` blocks after the icon-stripping refactor

Still alive (intentional):
- `components/doctor-agent/` — only 2 files (`mock-agent.ts`, `ai-brand.tsx`), referenced by 7+ callers. Don't move.
- `components/design-system/` — internal showcase pages mounted at `/(docs)/*`. Useful for design review, exclude from production build if size matters.

### Future cleanup candidates (do not delete without auditing)
- `components/voicerx/VoiceRxModuleRecorder.tsx` vs `VoiceRxRecorderPanel.tsx` vs `VoiceRxBottomSheet.tsx` — three recorder variants. Only `VoiceRxActiveAgent` is in the current flow. Verify before pruning the others.
- `components/tp-rxpad/dr-agent/DrAgentPanelV0.tsx` — the v0 simplified panel. Check if any active route still mounts it.
- `app/(docs)/` — design system showcase. Keep but tag for production exclusion.

---

## 10. Folder layout (current, post-cleanup)

```
app/
  (docs)/                       internal design-system showcase routes
  api/                          Next.js API routes (currently stubs)
  invisit/                      main consultation route
  patient-details/              patient profile route
  print-preview/                Rx print route
  rxpad/                        standalone Rx route

components/
  doctor-agent/                 shared utilities (ai-brand, mock-agent)
  design-system/                showcase components for /(docs)
  invisit/                      route-specific assemblage
  patient-details/              route-specific assemblage
  print-preview/                route-specific assemblage
  rx/rxpad/                     RxPad form components (prescription itself)
  tp-rxpad/                     the dr-agent + rxpad-sync surface
    dr-agent/
      cards/                    all card components (CardShell + 30+ card types)
      chat/                     ChatThread, ChatBubble, ChatInput
      docs/                     internal design docs (DO NOT delete)
      engines/                  reply-engine, voice-rx-engine, mock data
      hooks/
      shared/                   utility components shared across cards
      shell/                    panel chrome (AgentHeader, etc)
      utils/
      DrAgentPanel.tsx          the panel orchestrator
      DrAgentPanelV0.tsx        legacy simplified variant
      mock-data.ts              patient mocks
      types.ts                  shared types (~830 lines)
    rxpad-sync-context.tsx      THE COPY-TO-RX BUS
    RxPadFloatingAgent.tsx      the in-visit shell
  tp-ui/                        TP design-system primitives (TPMedicalIcon, TPSplitButton, etc)
  ui/                           shadcn-style primitives (button, dialog, dropdown, etc)
  voicerx/                      all voice-rx components
    VoiceRxActiveAgent.tsx      recorder (currently active)
    VoiceRxCanvas.tsx           review surface (currently active)
    VoiceTranscriptProcessingCard.tsx  shiner card during processing
    voice-consult-types.ts      voice-specific types
    use-live-transcript.ts      Web Speech API hook
    use-net-connection.ts       online/offline + slow detection
    voice-audio-utils.ts        AudioContext helpers

hooks/                          global hooks (use-touch-device, etc)
lib/                            non-React utilities
public/                         static assets — icons under public/icons/medical/
styles/                         globals.css
```
