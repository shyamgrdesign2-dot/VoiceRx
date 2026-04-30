"use client"

import React, { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import type { DoctorViewType, DrAgentVariant, SpecialtyTabId } from "../types"
import {
  TPDropdownMenu,
  TPDropdownMenuContent,
  TPDropdownMenuItem,
  TPDropdownMenuTrigger,
} from "@/components/tp-ui/tp-dropdown-menu"
import { Clock, Setting2 } from "iconsax-reactjs"

// -----------------------------------------------------------------
// Specialty → Auto-switch patient mapping
// -----------------------------------------------------------------

const SPECIALTY_PATIENT_MAP: Record<SpecialtyTabId, string> = {
  gp: "__patient__",         // Shyam GR
  gynec: "apt-lakshmi",      // Lakshmi K
  ophthal: "apt-anjali",     // Anjali Patel
  obstetric: "apt-priya",    // Priya Rao
  pediatrics: "apt-arjun",   // Arjun S
}

const SPECIALTY_OPTIONS: { id: SpecialtyTabId; label: string }[] = [
  { id: "gp", label: "GP" },
  { id: "gynec", label: "Gynec" },
  { id: "ophthal", label: "Ophthal" },
  { id: "obstetric", label: "Obstetric" },
  { id: "pediatrics", label: "Pediatrics" },
]

// -----------------------------------------------------------------
// Doctor View Type options (controls summary depth per doctor context)
// -----------------------------------------------------------------

const DOCTOR_VIEW_OPTIONS: { id: DoctorViewType; label: string; shortLabel: string }[] = [
  { id: "specialist_first_visit", label: "Specialist", shortLabel: "Specialist" },
  { id: "treating_physician", label: "Treating Doctor", shortLabel: "Treating" },
  { id: "emergency_oncall", label: "Emergency", shortLabel: "Emergency" },
]

// -----------------------------------------------------------------
// Intake Mode options
// -----------------------------------------------------------------

export type IntakeMode = "with_intake" | "without_intake"

const INTAKE_OPTIONS: { id: IntakeMode; label: string }[] = [
  { id: "with_intake", label: "With previous intake" },
  { id: "without_intake", label: "Without previous intake" },
]

// -----------------------------------------------------------------
// AgentHeader — Clean, minimal header with unified dropdown
// -----------------------------------------------------------------

interface AgentHeaderProps {
  availableSpecialties: SpecialtyTabId[]
  activeSpecialty: SpecialtyTabId
  onSpecialtyChange: (tab: SpecialtyTabId) => void
  onPatientChange: (id: string) => void
  selectedPatientId: string
  onClose: () => void
  className?: string
  /** Doctor view type — controls summary depth and pill selection */
  doctorViewType?: DoctorViewType
  onDoctorViewChange?: (type: DoctorViewType) => void
  /** Show doctor view selector (only for patients with POMR/SBAR data) */
  showDoctorViewSelector?: boolean
  /** Intake mode — with or without pre-visit intake */
  intakeMode?: IntakeMode
  onIntakeModeChange?: (mode: IntakeMode) => void
  /** Panel variant — V0 shows simplified header */
  variant?: DrAgentVariant
  /** Override gradient bar title (e.g. "VoiceRx" on in-visit flow) */
  brandTitle?: string
  /** Fired from the brand-pill kebab → "View session history" action. */
  onViewSessionHistory?: () => void
  /** Fired from the brand-pill kebab → "Settings" action. */
  onOpenSettings?: () => void
}

export function AgentHeader({
  activeSpecialty,
  onSpecialtyChange,
  onPatientChange,
  onClose,
  className,
  doctorViewType,
  onDoctorViewChange,
  showDoctorViewSelector,
  intakeMode = "with_intake",
  onIntakeModeChange,
  variant = "full",
  brandTitle,
  onViewSessionHistory,
  onOpenSettings,
}: AgentHeaderProps) {
  const isV0 = variant === "v0"
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [dropdownOpen])

  const activeSpecLabel = SPECIALTY_OPTIONS.find((o) => o.id === activeSpecialty)?.label ?? "GP"
  const activeDoctorLabel = DOCTOR_VIEW_OPTIONS.find((o) => o.id === doctorViewType)?.shortLabel
  const activeIntakeLabel = intakeMode === "with_intake" ? "Intake" : "No intake"

  // Build compact badge text for the dropdown trigger
  const badgeParts: string[] = [activeSpecLabel]
  if (showDoctorViewSelector && activeDoctorLabel) {
    badgeParts.push(activeDoctorLabel)
  }

  function handleSpecialtySelect(id: SpecialtyTabId) {
    onSpecialtyChange(id)
    const patientId = SPECIALTY_PATIENT_MAP[id]
    if (patientId) {
      onPatientChange(patientId)
    }
  }

  return (
    <div className={cn("relative z-20", className)}>
      {/* Header — transparent, floating tags (no bar, no divider). */}
      <div
        className="relative flex items-center justify-between px-[14px] pt-[4px]"
        style={{ height: 52, background: "transparent" }}
      >
        {/* Left: Dr. Agent brand tag — floating liquid-glass card with 10px radius */}
        <div className="pointer-events-auto relative z-10 flex items-center gap-[6px]">
          <span className="vrx-agent-brand-tag relative flex items-center gap-[8px] rounded-[10px] p-[6px]">
            <span
              className="relative inline-flex h-[24px] w-[24px] shrink-0 items-center justify-center overflow-hidden"
              aria-hidden
              style={{ borderRadius: 8 }}
            >
              {/* AI sparkle — bumped to 24×24 to match the Conversation /
                  Dictation mode-pill spark sizing. */}
              <img
                src="/icons/dr-agent/agent-bg.svg"
                alt=""
                draggable={false}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <img
                src="/icons/dr-agent/agent-spark.svg"
                alt=""
                draggable={false}
                className="relative z-10"
                width={14}
                height={14}
              />
            </span>
            <span
              className="text-[14px] font-semibold leading-none text-tp-slate-700"
              style={{ letterSpacing: "0.1px" }}
            >
              {brandTitle ?? "VoiceRx"}
            </span>

            {/* Brand-pill kebab — TP-styled dropdown with two actions:
                "View session history" → opens the SessionHistoryDrawer
                "Settings" → opens preferences (parent-handled). */}
            <TPDropdownMenu>
              <TPDropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="inline-flex h-[20px] w-[20px] items-center justify-center bg-transparent text-tp-slate-700 transition-colors hover:text-tp-slate-900 active:scale-[0.94]"
                  aria-label="VoiceRx options"
                  onClick={(e) => e.stopPropagation()}
                >
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                    <circle cx="12" cy="5" r="2" />
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="12" cy="19" r="2" />
                  </svg>
                </button>
              </TPDropdownMenuTrigger>
              {/* Kebab menu — TP violet leading icons, tight icon↔label gap,
                  neutral gray hover (not blue), per latest design call. */}
              <TPDropdownMenuContent align="start" className="w-[220px]">
                <TPDropdownMenuItem
                  onClick={() => onViewSessionHistory?.()}
                  className="flex items-center gap-1.5 hover:bg-tp-slate-100 hover:text-tp-slate-900 focus:bg-tp-slate-100 focus:text-tp-slate-900"
                >
                  <Clock size={16} variant="Bulk" className="text-tp-violet-500" />
                  <span>View session history</span>
                </TPDropdownMenuItem>
                <TPDropdownMenuItem
                  onClick={() => onOpenSettings?.()}
                  className="flex items-center gap-1.5 hover:bg-tp-slate-100 hover:text-tp-slate-900 focus:bg-tp-slate-100 focus:text-tp-slate-900"
                >
                  <Setting2 size={16} variant="Bulk" className="text-tp-violet-500" />
                  <span>Settings</span>
                </TPDropdownMenuItem>
              </TPDropdownMenuContent>
            </TPDropdownMenu>
          </span>

          {/* Unified Dropdown — Specialty + Doctor Type + Intake (removed — demo only) */}
          {false && <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((v) => !v)}
              className={cn(
                "flex items-center gap-[4px] rounded-full px-[7px] py-[2px]",
                "text-[12px] leading-[1.3] text-white/60",
                "bg-white/10 backdrop-blur-sm transition-colors duration-150",
                "hover:bg-white/20 hover:text-white/90",
                dropdownOpen && "bg-white/20 text-white/90",
              )}
            >
              {/* Compact badge chips */}
              {badgeParts.map((part, i) => (
                <React.Fragment key={part}>
                  {i > 0 && <span className="text-white/30">·</span>}
                  <span>{part}</span>
                </React.Fragment>
              ))}
              <svg
                width={8}
                height={8}
                viewBox="0 0 10 10"
                fill="none"
                className={cn(
                  "flex-shrink-0 transition-transform duration-150",
                  dropdownOpen && "rotate-180",
                )}
              >
                <path
                  d="M2.5 3.75L5 6.25L7.5 3.75"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {/* Dropdown panel — multi-section */}
            {dropdownOpen && (
              <div
                className={cn(
                  "absolute left-0 top-full z-[120] mt-[4px]",
                  "min-w-[180px] rounded-[10px] border border-tp-slate-100/80",
                  "bg-white/95 backdrop-blur-md shadow-[0_6px_20px_rgba(0,0,0,0.08)]",
                )}
              >
                {/* Demo notice */}
                <div className="border-b border-tp-slate-300 px-[10px] py-[4px]">
                  <p className="text-[10px] leading-[1.3] text-tp-slate-400 italic">
                    Demo only — not in production
                  </p>
                </div>

                {/* ── Section 1: Specialty ── */}
                <div className="px-[10px] pt-[6px] pb-[2px]">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-tp-slate-400 mb-[3px]">Specialty</p>
                  <div className="flex flex-wrap gap-[4px] pb-[6px]">
                    {SPECIALTY_OPTIONS.map((opt) => {
                      const isActive = opt.id === activeSpecialty
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSpecialtySelect(opt.id)}
                          className={cn(
                            "rounded-full px-[8px] py-[3px] text-[12px] leading-[1.3] transition-all duration-100",
                            isActive
                              ? "bg-tp-slate-700 text-white font-medium"
                              : "bg-tp-slate-50 text-tp-slate-500 hover:bg-tp-slate-100 hover:text-tp-slate-700",
                          )}
                        >
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* ── Section 2: Doctor Type (View As) ── */}
                {showDoctorViewSelector && doctorViewType && onDoctorViewChange && (
                  <>
                    <div className="mx-[10px] border-t border-tp-slate-300" />
                    <div className="px-[10px] pt-[6px] pb-[2px]">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-tp-slate-400 mb-[3px]">View as</p>
                      <div className="flex flex-wrap gap-[4px] pb-[6px]">
                        {DOCTOR_VIEW_OPTIONS.map((opt) => {
                          const isActive = opt.id === doctorViewType
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => onDoctorViewChange(opt.id)}
                              className={cn(
                                "rounded-full px-[8px] py-[3px] text-[12px] leading-[1.3] transition-all duration-100",
                                isActive
                                  ? "bg-tp-violet-600 text-white font-medium"
                                  : "bg-tp-slate-50 text-tp-slate-500 hover:bg-tp-violet-50 hover:text-tp-violet-700",
                              )}
                            >
                              {opt.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </>
                )}

                {/* ── Section 3: Intake Mode ── */}
                {onIntakeModeChange && (
                  <>
                    <div className="mx-[10px] border-t border-tp-slate-300" />
                    <div className="px-[10px] pt-[6px] pb-[6px]">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-tp-slate-400 mb-[3px]">Intake</p>
                      <div className="flex gap-[4px]">
                        {INTAKE_OPTIONS.map((opt) => {
                          const isActive = opt.id === intakeMode
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => onIntakeModeChange(opt.id)}
                              className={cn(
                                "rounded-full px-[8px] py-[3px] text-[12px] leading-[1.3] transition-all duration-100",
                                isActive
                                  ? "bg-tp-blue-600 text-white font-medium"
                                  : "bg-tp-slate-50 text-tp-slate-500 hover:bg-tp-blue-50 hover:text-tp-blue-700",
                              )}
                            >
                              {opt.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>}
        </div>

        {/* Right: Actions — three-dots menu now lives inside the brand pill;
            this section keeps only the Collapse button. */}
        <div className="flex items-center gap-2">
          {/* Collapse Button — wrapped in the same liquid-glass chip
              (.vrx-agent-collapse-tag) used by the brand pill so the
              two affordances on this row read as a matched pair. 18px
              icon, slate-700, glossy backdrop. */}
          <button
            type="button"
            onClick={onClose}
            className="vrx-agent-collapse-tag pointer-events-auto inline-flex h-[32px] w-[32px] items-center justify-center rounded-[10px] text-tp-slate-700 transition-colors hover:text-tp-slate-900 active:scale-[0.95]"
            aria-label="Minimize agent"
          >
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="1.5" />
              <path d="M9 3v18" stroke="currentColor" strokeWidth="1.5" />
              <path d="M13 9l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <style>{`
        /* Dr. Agent brand tag — iOS liquid-glass with subtle AI gradient tint.
           Low bg opacity + strong blur + saturate so content scrolling behind
           is visibly diffused through the glass. */
        .vrx-agent-brand-tag {
          background:
            linear-gradient(180deg, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.18) 100%),
            linear-gradient(135deg, rgba(213,101,234,0.14) 0%, rgba(103,58,172,0.10) 55%, rgba(75,74,213,0.10) 100%);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.80),
            inset 0 0 0 1px rgba(103,58,172,0.12),
            0 4px 12px -4px rgba(103,58,172,0.12);
        }
        /* Glossy chip — shared by both the brand-pill kebab and the
           Minimize-agent button so the two trailing controls in the
           panel header speak the same liquid-glass language. */
        .vrx-agent-glossy-chip,
        .vrx-agent-collapse-tag {
          background:
            linear-gradient(180deg, rgba(255,255,255,0.48) 0%, rgba(255,255,255,0.22) 100%),
            linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(75,74,213,0.08) 100%);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.85),
            inset 0 0 0 1px rgba(15,23,42,0.08),
            0 4px 12px -4px rgba(15,23,42,0.08);
          transition: background 180ms ease, box-shadow 180ms ease, color 180ms ease, transform 120ms ease;
        }
        .vrx-agent-glossy-chip:hover,
        .vrx-agent-collapse-tag:hover {
          background:
            linear-gradient(180deg, rgba(255,255,255,0.68) 0%, rgba(255,255,255,0.38) 100%),
            linear-gradient(135deg, rgba(139,92,246,0.10) 0%, rgba(75,74,213,0.10) 100%);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,1),
            inset 0 0 0 1px rgba(15,23,42,0.12),
            0 6px 16px -4px rgba(15,23,42,0.12);
        }
      `}</style>
    </div>
  )
}
