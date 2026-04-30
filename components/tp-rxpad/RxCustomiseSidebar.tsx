"use client"

import { useEffect, useRef, useState } from "react"
import { GripVertical } from "lucide-react"
import { TPMedicalIcon } from "@/components/tp-ui/medical-icons"
import { TutorialPlayIcon } from "@/components/tp-ui/TutorialPlayIcon"

// ── Solid close-square icon (same glyph used in RxPreviewSidebar) ──────────
function CloseSquareIcon({ size = 22, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M16.19 2H7.81C4.17 2 2 4.17 2 7.81V16.18C2 19.83 4.17 22 7.81 22H16.18C19.82 22 21.99 19.83 21.99 16.19V7.81C22 4.17 19.83 2 16.19 2ZM15.36 14.3C15.65 14.59 15.65 15.07 15.36 15.36C15.21 15.51 15.02 15.58 14.83 15.58C14.64 15.58 14.45 15.51 14.3 15.36L12 13.06L9.7 15.36C9.55 15.51 9.36 15.58 9.17 15.58C8.98 15.58 8.79 15.51 8.64 15.36C8.35 15.07 8.35 14.59 8.64 14.3L10.94 12L8.64 9.7C8.35 9.41 8.35 8.93 8.64 8.64C8.93 8.35 9.41 8.35 9.7 8.64L12 10.94L14.3 8.64C14.59 8.35 15.07 8.35 15.36 8.64C15.65 8.93 15.65 9.41 15.36 9.7L13.06 12L15.36 14.3Z" />
    </svg>
  )
}

// ── Section config types ────────────────────────────────────────────────────

export type RxSectionId =
  | "symptoms"
  | "examinations"
  | "diagnosis"
  | "medication"
  | "advice"
  | "lab"
  | "surgery"

export type RxSectionItem = {
  id: RxSectionId
  label: string
  enabled: boolean
}

const SECTION_META: Record<RxSectionId, { label: string; iconName: string }> = {
  symptoms:     { label: "Symptoms",           iconName: "Virus" },
  examinations: { label: "Examinations",       iconName: "medical service" },
  diagnosis:    { label: "Diagnosis",          iconName: "Diagnosis" },
  medication:   { label: "Medication (Rx)",    iconName: "Tablets" },
  advice:       { label: "Advices",            iconName: "health care" },
  lab:          { label: "Lab Investigation",  iconName: "Test Tube" },
  surgery:      { label: "Surgery",            iconName: "surgical-scissors-02" },
}

export const DEFAULT_SECTION_CONFIG: RxSectionItem[] = (
  Object.keys(SECTION_META) as RxSectionId[]
).map((id) => ({ id, label: SECTION_META[id].label, enabled: true }))

// ── Inline toggle switch ────────────────────────────────────────────────────
function ToggleSwitch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-[24px] w-[44px] shrink-0 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tp-blue-400 focus-visible:ring-offset-2 ${
        disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
      } ${checked ? "bg-tp-blue-500" : "bg-tp-slate-300"}`}
    >
      <span
        className={`inline-block h-[18px] w-[18px] rounded-full bg-white shadow-[0_1px_4px_rgba(15,23,42,0.22)] transition-transform duration-200 ${
          checked ? "translate-x-[22px]" : "translate-x-[3px]"
        }`}
      />
    </button>
  )
}

// ── Props ───────────────────────────────────────────────────────────────────

interface RxCustomiseSidebarProps {
  open: boolean
  onClose: () => void
  sectionConfig: RxSectionItem[]
  onSave: (config: RxSectionItem[]) => void
}

// ── Component ───────────────────────────────────────────────────────────────

export function RxCustomiseSidebar({
  open,
  onClose,
  sectionConfig,
  onSave,
}: RxCustomiseSidebarProps) {
  // Animation state — same pattern as RxPreviewSidebar.
  const [isMounted, setIsMounted] = useState(open)
  const [isVisible, setIsVisible] = useState(open)

  useEffect(() => {
    if (open) {
      setIsMounted(true)
      const id = window.requestAnimationFrame(() => setIsVisible(true))
      return () => window.cancelAnimationFrame(id)
    }
    setIsVisible(false)
    const id = window.setTimeout(() => setIsMounted(false), 300)
    return () => window.clearTimeout(id)
  }, [open])

  // ESC closes.
  useEffect(() => {
    if (!isMounted) return
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [isMounted, onClose])

  // Local edit state — seeded from prop on each open.
  const [localConfig, setLocalConfig] = useState<RxSectionItem[]>(sectionConfig)
  useEffect(() => {
    if (open) setLocalConfig(sectionConfig)
  }, [open, sectionConfig])

  // ── Drag-to-reorder (HTML5 drag API) ──────────────────────────────────────
  const draggingId = useRef<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  function handleDragStart(id: string) {
    draggingId.current = id
  }

  function handleDragOver(e: React.DragEvent, id: string) {
    e.preventDefault()
    if (draggingId.current && draggingId.current !== id) setDragOverId(id)
  }

  function handleDrop(targetId: string) {
    const from = draggingId.current
    if (!from || from === targetId) { draggingId.current = null; setDragOverId(null); return }
    setLocalConfig((prev) => {
      const next = [...prev]
      const fromIdx = next.findIndex((s) => s.id === from)
      const toIdx = next.findIndex((s) => s.id === targetId)
      const [item] = next.splice(fromIdx, 1)
      next.splice(toIdx, 0, item)
      return next
    })
    draggingId.current = null
    setDragOverId(null)
  }

  function handleDragEnd() {
    draggingId.current = null
    setDragOverId(null)
  }

  function toggleSection(id: string) {
    setLocalConfig((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    )
  }

  function handleReset() {
    setLocalConfig(DEFAULT_SECTION_CONFIG.map((s) => ({ ...s })))
  }

  function handleSave() {
    onSave(localConfig)
    onClose()
  }

  const enabledCount = localConfig.filter((s) => s.enabled).length

  if (!isMounted) return null

  return (
    <>
      {/* Dimming backdrop */}
      <div
        aria-hidden
        onClick={onClose}
        className={`fixed inset-0 z-[100] bg-black/30 backdrop-blur-[2px] transition-opacity duration-200 ${
          isVisible ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Slide-in panel — 60% desktop, 75% iPad, 94vw mobile */}
      <aside
        role="dialog"
        aria-label="Customise your Rx layout"
        aria-hidden={!isVisible}
        className={`fixed right-0 top-0 z-[101] flex h-full flex-col bg-white shadow-[-12px_0_40px_rgba(15,23,42,0.18)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] w-[94vw] md:w-[75vw] lg:w-[60vw] ${
          isVisible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* ── Header — close X → divider → title | Tutorial ───────────── */}
        <header className="flex h-[56px] shrink-0 items-center justify-between border-b border-tp-slate-100 px-[16px]">
          <div className="flex min-w-0 items-center gap-[12px]">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close customise panel"
              className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-[8px] text-tp-slate-700 transition-colors hover:bg-tp-slate-100 hover:text-tp-slate-900 active:scale-[0.96]"
            >
              <CloseSquareIcon size={22} />
            </button>
            <span aria-hidden className="h-[24px] w-px shrink-0 bg-tp-slate-200" />
            <h3 className="truncate text-[16px] font-semibold tracking-[-0.1px] text-tp-slate-800">
              Customise Your Rx
            </h3>
          </div>
          <button
            type="button"
            aria-label="Watch tutorial"
            className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[8px] text-tp-slate-600 transition-colors hover:bg-tp-slate-100 active:scale-[0.96]"
          >
            <TutorialPlayIcon size={26} />
          </button>
        </header>

        {/* ── Body ────────────────────────────────────────────────────────── */}
        <div className="min-h-0 flex-1 overflow-y-auto px-[16px] py-[20px]">
          <div className="mb-[16px] flex items-center justify-between">
            <div>
              <p className="text-[14px] font-semibold text-tp-slate-800">Rx Sections</p>
              <p className="mt-[2px] text-[12px] text-tp-slate-500">
                Toggle sections on or off. Drag to reorder.
              </p>
            </div>
            <span className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-tp-blue-50 px-[8px] text-[12px] font-semibold text-tp-blue-600">
              {enabledCount}/{localConfig.length}
            </span>
          </div>

          <div className="space-y-[8px]">
            {localConfig.map((section) => {
              const meta = SECTION_META[section.id as RxSectionId]
              const isDragOver = dragOverId === section.id

              return (
                <div
                  key={section.id}
                  draggable
                  onDragStart={() => handleDragStart(section.id)}
                  onDragOver={(e) => handleDragOver(e, section.id)}
                  onDrop={() => handleDrop(section.id)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-[12px] rounded-[14px] border bg-white px-[14px] py-[12px] transition-all duration-150 ${
                    isDragOver
                      ? "border-tp-blue-300 shadow-[0_0_0_2px_rgba(99,102,241,0.12)]"
                      : "border-tp-slate-100"
                  } ${!section.enabled ? "opacity-50" : ""}`}
                >
                  {/* Drag handle */}
                  <GripVertical
                    size={18}
                    strokeWidth={1.5}
                    className="shrink-0 cursor-grab text-tp-slate-400 active:cursor-grabbing"
                  />

                  {/* Section icon */}
                  <span className="inline-flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[10px] bg-tp-violet-50">
                    <TPMedicalIcon
                      name={meta.iconName as any}
                      variant="bulk"
                      size={20}
                      color="var(--tp-violet-500)"
                    />
                  </span>

                  {/* Section label */}
                  <span className="min-w-0 flex-1 text-[14px] font-medium text-tp-slate-800">
                    {section.label}
                  </span>

                  {/* Toggle */}
                  <ToggleSwitch
                    checked={section.enabled}
                    onChange={() => toggleSection(section.id)}
                    disabled={section.enabled && enabledCount <= 1}
                  />
                </div>
              )
            })}
          </div>

          <p className="mt-[16px] text-[12px] leading-[1.6] text-tp-slate-400">
            At least one section must remain enabled.
          </p>
        </div>

        {/* ── Footer — Reset (secondary) + Save (primary) ─────────────────── */}
        <footer className="flex shrink-0 items-center justify-between gap-[12px] border-t border-tp-slate-100 px-[16px] py-[14px]">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex h-[44px] items-center justify-center rounded-[12px] border border-tp-slate-300 bg-white px-[20px] text-[14px] font-semibold text-tp-slate-700 transition-colors hover:bg-tp-slate-50 active:scale-[0.98]"
          >
            Reset to default
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex h-[44px] flex-1 items-center justify-center rounded-[12px] text-[14px] font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #D565EA 0%, #673AAC 55%, #1A1994 100%)" }}
          >
            Save Changes
          </button>
        </footer>
      </aside>
    </>
  )
}
