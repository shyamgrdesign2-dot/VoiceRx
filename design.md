# Design System Reference

> The visual + interaction contract for TatvaPractice / Dr.Agent / VoiceRx surfaces.
> Read this before writing any new component, card, button, or callout.

This file is the single source of truth for **how things look**. The
companion files cover **how things are wired** (`engineering.md`) and
**how to plug in a real backend** (`integration.md`).

---

## 1. Sizing rules — STRICT

**Every numeric size must be an EVEN number.** No exceptions in product UI.

| Token type | Allowed values | Floor |
|---|---|---|
| Font size | `10px · 12px · 14px · 16px · 18px · 20px · 24px · 28px · 32px` | **10px** (uppercase trackers only) |
| Spacing / gap / padding | `2 · 4 · 6 · 8 · 10 · 12 · 14 · 16 · 18 · 20 · 24 · 32 · 40 · 48` | 2px |
| Border radius | `2 · 4 · 6 · 8 · 10 · 12 · 14 · 16 · 20 · 24 · 9999` | 2px |
| Border width | `1px` (hairlines) or `2px` | 1px |

**Banned values:** `9px · 11px · 13px · 15px · 17px · 11.5px · 13.5px · 12.5px · 10.5px`. If a Figma mock shows them, treat as the nearest even value above (13 → 14, 11 → 12).

**Why**: subpixel rendering on non-Retina screens, 2px design grid, scale-transform composability. The full reasoning lives in
`components/tp-rxpad/dr-agent/docs/00-sizing-rules.md`.

**Quick lookup**:

| You wrote | Use this |
|---|---|
| `text-[11px]` | `text-[12px]` |
| `text-[13px]` | `text-[14px]` |
| `gap-[7px]` | `gap-[8px]` (or 6) |
| `rounded-[9px]` | `rounded-[10px]` (or 8) |
| `h-[34px]` | `h-[36px]` (or 32) |

**Exceptions** (genuinely the only ones):
- `1px` hairline borders / dividers
- Unitless line-heights (`leading-[1.5]` is fine — it's a multiplier, not a pixel)

---

## 2. Type scale

| Use | Class | Notes |
|---|---|---|
| Body / list items / table cells / CTA labels | `text-[14px]` | The default. If unsure, use 14. |
| Card titles | `text-[14px] font-semibold` | (CardShell already applies this) |
| Subtitles / meta / tooltip body / coachmark / badge | `text-[12px]` | |
| Uppercase trackers ("SOURCES", "CURRENT SESSION") | `text-[10px] font-semibold uppercase tracking-wider` | The only place 10px is allowed |

Line-heights: `leading-[1.4]` for compact UI text, `leading-[1.5]` for paragraph copy, `leading-none` only for label rows.

---

## 3. Color tokens

The full Tailwind config is in `tailwind.config.ts`. Use these shorthand semantics:

### Brand
- `tp-blue-500` (#4B4AD5) — primary brand. Reserve for primary CTAs, brand accents, NOT for inline icons.
- `tp-blue-50/100/600` — hover / surface variants of brand.
- `tp-violet-50/100/300/500` — secondary brand (AI/Dr.Agent signature).

### Neutrals (default chrome)
- `tp-slate-50` — page surface tints
- `tp-slate-100` — soft fills, hover backgrounds
- `tp-slate-200` — borders
- `tp-slate-400` — disabled / placeholder text
- `tp-slate-500` — meta text
- `tp-slate-600` — secondary text, label
- `tp-slate-700` — **default body / icon color** (this is the workhorse)
- `tp-slate-800/900` — strongest text, headings, hover states

### State
- `tp-success-500/600` — success ("Filled" flash)
- `tp-error-500/600` — destructive
- `tp-warning` / `amber-600/700` — warning callouts (e.g., the canvas coachmark)

### Color rules
1. **Inline icons default to `tp-slate-700`**, hover to `tp-slate-900`. Do not paint inline icons in brand blue — that's reserved for primary CTAs.
2. **Coachmark / heads-up callouts use the amber palette** (`amber-600` icon, `amber-700` label). Brand blue on a callout reads like marketing, amber reads like "pay attention".
3. **"Filled" success flash uses `tp-success-500`** with the `vrx-filled-flash` keyframe.
4. **Section header tints** (e.g., `bg-tp-slate-100/70`) are intentionally low-contrast — the section title is meta, the items are the content.

---

## 4. Component patterns

### CardShell (`components/tp-rxpad/dr-agent/cards/CardShell.tsx`)

The chrome for every Dr.Agent card. Anatomy:

```
┌─────────────────────────────────────────┐
│ [icon] Title          [extras]   [▼]    │  ← header (gradient bg)
│        Subtitle                          │
├─────────────────────────────────────────┤
│ {children}                               │  ← body
├─────────────────────────────────────────┤
│ [actions row, optional]                  │
│ [sidebar link, optional]                 │
└─────────────────────────────────────────┘
```

**Required props**: `icon`, `title`, `children`. **Common props**: `tpIconName`, `date`, `badge`, `copyAll`, `collapsible`, `dataSources`, `headerExtra`.

**Don't reinvent it.** A new card type is `<CardShell><MyContent /></CardShell>`.

### Section list pattern

Used in PatientReportedCard, VoiceStructuredRxCard, OCR cards, Lab cards. Every section is:

1. `SectionSummaryBar` — gray-100 bar with section icon + title + trailing actions (copy)
2. `<ul>` of `<li>` rows — bullet + content + optional inline copy on hover

**Always-visible vs hover-revealed copy icons**:
- Canvas / focused-review surfaces → always visible
- Chat / list-of-cards surfaces → hover-reveal on desktop, soft `opacity-70` on touch

### Footer CTAs

Two patterns, both using even-number sizes:

**Primary** (filled blue):
```tsx
className="flex h-[42px] flex-1 items-center justify-center gap-2 rounded-[10px] px-3 text-[14px] font-semibold text-white bg-tp-blue-500 hover:bg-tp-blue-600"
```

**Secondary** (outline, blue text on white):
```tsx
className="flex h-[36px] w-full items-center justify-center gap-[8px] rounded-[10px] border border-tp-blue-300 bg-white px-3 text-[14px] font-semibold text-tp-blue-500 hover:bg-tp-blue-50"
```

**When to use which**:
- Card-internal "Copy all to RxPad" footer → secondary outline (the card itself is the surface, the CTA shouldn't dominate)
- Canvas-level primary action ("Copy all to EMR" on `VoiceRxCanvas`) → primary filled
- Page-level decisive actions ("End Visit", "Save & Print") → primary filled

### Coachmark / heads-up callout

Amber palette, soft gradient bg, dismissible:
```tsx
<div className="relative flex items-start gap-[8px] rounded-[10px] py-[8px] pl-[10px] pr-[28px]"
     style={{
       background: "linear-gradient(180deg, rgba(245,158,11,0.10) 0%, rgba(245,158,11,0.04) 100%)",
       border: "1px solid rgba(245,158,11,0.30)",
     }}>
  <InfoCircle size={16} variant="Bulk" className="text-amber-600" />
  <p className="text-[12px] leading-[1.5] text-tp-slate-700">
    <span className="font-semibold text-amber-700">Heads up — </span>
    {body}
  </p>
  <button onClick={dismiss} className="...">×</button>
</div>
```

First-time-only via `localStorage[KEY_v1]`. Bump `_v1 → _v2` if copy materially changes.

### Mode pills (recorder + canvas chrome)

`px-[8px] py-[6px] gap-[4px] rounded-[10px]`, glassy gradient background. Inside: naked SVG buttons (no chip backgrounds), 16px icons, `bg-transparent`, hover via color change only. Both `VoiceRxActiveAgent` and `VoiceRxCanvas` use this exact geometry — keep them in sync.

### Naked icon buttons

The default for any icon-only affordance inside a pill or container:
```tsx
<button className="inline-flex h-[20px] w-[20px] items-center justify-center bg-transparent text-tp-slate-700 hover:text-tp-slate-900 transition-colors active:scale-[0.92]">
  <SomeIcon size={16} />
</button>
```

No chip background. Hover changes color. The 20×20 wrapper is just hit-area.

---

## 5. Animation tokens

| Use | Duration | Easing |
|---|---|---|
| Button press / scale feedback | 120ms | linear / ease-out |
| Hover color change | 160–180ms | ease |
| Card fades / mounts | 220ms | `ease-out` |
| Panel flips / large transitions | 320ms | `cubic-bezier(0.16,1,0.3,1)` |
| Word-stagger reveals | 340ms per word, 35ms stagger | `cubic-bezier(0.22,1,0.36,1)` |

**Always honor `prefers-reduced-motion`**:
```css
@media (prefers-reduced-motion: reduce) {
  .my-anim { animation: none; opacity: 1; transform: none; }
}
```

---

## 6. Voice / VoiceRx-specific

### Recorder vs canvas chrome
- **Recorder** (active recording): mode pill says `"Conversation Mode"` / `"Dictation Mode"`. The verb says you're IN it.
- **Canvas** (post-submit review): mode pill says `"Structured Clinical Notes"`. Names the OUTPUT, not the mode.

### The shiner card (transcript processing)
Used during the post-submit processing window. Soft slate-50 background, 2.2s shine sweep, italic transcript with double-quote wrappers and word-stagger reveal. Component: `VoiceTranscriptProcessingCard`.

### Sidebar batch deferral
On voice-rx submit, vitals/history updates are NOT applied immediately — they ride on `voiceRxResult.pendingSidebarBatch` until the doctor explicitly hits "Copy all to EMR". This keeps the canvas a clean preview surface.

---

## 7. UX principles (the short list)

1. **Show one heading, never two.** If the surface chrome already names something, don't add an inline header inside the card.
2. **Default-visible affordances on focused-review surfaces.** Hover-reveal is for crowded list views.
3. **First-run education uses one-time coachmarks**, never permanent banners. Persisted via localStorage with a version suffix.
4. **Differentiate the "what" from the "how"**: card titles say what the data IS, footer CTAs say what to DO with it.
5. **Two surfaces showing the same data should differ in chrome, not content.** The chat preview card and the canvas show the same `VoiceStructuredRxData`; only their affordances differ.
6. **Pre-clinical errors are silent**: if the network is slow or the mic isn't ready, the panel adapts (loader, retry) — it does not throw a red banner. See `engineering.md` §6 for the full error matrix.
