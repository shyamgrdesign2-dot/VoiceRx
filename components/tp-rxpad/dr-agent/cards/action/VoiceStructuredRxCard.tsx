"use client"

import React, { useState } from "react"
import { cn } from "@/lib/utils"
import { useTouchDevice } from "@/hooks/use-touch-device"
import { CardShell } from "../CardShell"
import { CopyIcon } from "../CopyIcon"
import { ActionableTooltip } from "../ActionableTooltip"
import { SectionSummaryBar } from "../SectionSummaryBar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DocumentText, Maximize4 } from "iconsax-reactjs"
import type { VoiceStructuredRxData, VoiceRxItem } from "../../types"
import type { RxPadCopyPayload } from "@/components/tp-rxpad/rxpad-sync-context"

interface VoiceStructuredRxCardProps {
  data: VoiceStructuredRxData
  onCopy?: (payload: RxPadCopyPayload) => void
  onExpand?: () => void
  hideHeader?: boolean
}

/** Format a VoiceRxItem to a plain text string for clipboard copy */
function formatVoiceItem(item: VoiceRxItem): string {
  return item.detail ? `${item.name} (${item.detail})` : item.name
}

/**
 * Build a minimal RxPadCopyPayload for a single item (or list of items)
 * scoped to one section. Used by per-item / per-section Copy actions
 * so the doctor can sync individual rows to the RxPad — earlier the
 * per-item icon only wrote to clipboard and the section icon was
 * filtered out by the empty payload.
 */
function buildSectionPayload(sectionId: string, items: VoiceRxItem[]): RxPadCopyPayload {
  const labels = items.map(formatVoiceItem)
  const base: RxPadCopyPayload = {
    sourceDateLabel: "Voice consult",
    targetSection: "rxpad",
  }
  switch (sectionId) {
    case "symptoms":
      return { ...base, symptoms: labels }
    case "examination":
    case "examinations":
      return { ...base, examinations: labels }
    case "diagnosis":
    case "diagnoses":
      return { ...base, diagnoses: labels }
    case "advice":
      return { ...base, advice: labels.join("\n") }
    case "investigation":
    case "investigations":
    case "lab":
    case "labInvestigations":
      return { ...base, labInvestigations: labels }
    case "followUp":
    case "follow_up":
      return { ...base, followUp: labels.join("; ") }
    case "history":
      return { ...base, historyChangeSummaries: labels }
    case "medication":
    case "medications":
      // We don't have structured fields here, so push the readable
      // composed string as a medication "note" until the Voice parser
      // emits structured medication seeds.
      return {
        ...base,
        medications: items.map((it) => ({
          medicine: it.name,
          unitPerDose: "",
          frequency: "",
          when: "",
          duration: "",
          note: it.detail ?? "",
        })),
      }
    default:
      // Catch-all: drop into additionalNotes so nothing is lost.
      return { ...base, additionalNotes: labels.join("\n") }
  }
}

export function VoiceStructuredRxCard({ data, onCopy, onExpand, hideHeader }: VoiceStructuredRxCardProps) {
  const isTouch = useTouchDevice()
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const handleCopyItem = (sectionId: string, item: VoiceRxItem, key: string) => {
    navigator.clipboard?.writeText(formatVoiceItem(item))
    onCopy?.(buildSectionPayload(sectionId, [item]))
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 1500)
  }

  const handleCopySection = (sectionId: string, items: VoiceRxItem[]) => {
    const text = items.map(formatVoiceItem).join("\n")
    navigator.clipboard?.writeText(text)
    onCopy?.(buildSectionPayload(sectionId, items))
    setCopiedKey(`section-${sectionId}`)
    setTimeout(() => setCopiedKey(null), 1500)
  }

  const handleExpand = () => {
    if (onExpand) {
      onExpand()
    } else {
      window.dispatchEvent(new CustomEvent("open-voicerx", { detail: { data } }))
    }
  }

  const innerContent = (
    <div className="flex flex-col gap-[8px]">
        {/* Structured sections */}
        {data.sections.map((section) => (
          <div key={section.sectionId}>
            {/* Section header bar with hover copy icon */}
            <SectionSummaryBar
              label={section.title}
              icon={section.tpIconName}
              trailing={
                copiedKey === `section-${section.sectionId}` ? (
                  <TooltipProvider delayDuration={120}>
                    <Tooltip open>
                      <TooltipTrigger asChild>
                        <span className="vrx-filled-flash inline-flex items-center gap-[3px] text-[12.5px] font-semibold text-tp-success-500">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                            <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          Filled
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={6} className="rounded-[6px] border-0 bg-tp-slate-900 px-2.5 py-1.5 text-[11.5px] leading-[1.45] text-white shadow-[0_8px_20px_-10px_rgba(15,23,42,0.45)]">
                        {section.title} filled into RxPad
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <span className={cn("transition-opacity", isTouch ? "opacity-70" : "opacity-0 group-hover/section-header:opacity-100")}>
                    <ActionableTooltip
                      label={`Fill ${section.title.toLowerCase()} to RxPad`}
                      onAction={() => handleCopySection(section.sectionId, section.items)}
                    >
                      <CopyIcon size={14} onClick={() => handleCopySection(section.sectionId, section.items)} />
                    </ActionableTooltip>
                  </span>
                )
              }
            />

            {/* Bullet items with per-item hover copy — structured name (detail) format */}
            <ul className="mt-1 flex flex-col gap-[2px] pl-1">
              {section.items.map((item, idx) => {
                const itemKey = `${section.sectionId}-${idx}`
                return (
                  <li
                    key={idx}
                    className="group/voice-item flex items-start gap-[6px] rounded-[4px] px-1 -mx-1 py-[2px] text-[14px] leading-[1.6] text-tp-slate-700 transition-colors hover:bg-tp-slate-50/80"
                  >
                    <span className="mt-[1px] flex-shrink-0 text-tp-slate-400">
                      •
                    </span>
                    {/* On touch the doctor taps the row text to surface
                        an actionable "Copy to Rx" tooltip — no inline
                        copy icon clutters every line. On desktop the
                        per-item copy icon stays as before. */}
                    {isTouch ? (
                      <ActionableTooltip
                        label="Copy to Rx"
                        onAction={() => handleCopyItem(section.sectionId, item, itemKey)}
                      >
                        <span className="flex-1 cursor-pointer font-normal text-tp-slate-700">
                          {item.name}
                          {item.detail && (
                            <span className="ml-1 text-tp-slate-400">({item.detail})</span>
                          )}
                        </span>
                      </ActionableTooltip>
                    ) : (
                      <span className="flex-1 font-normal text-tp-slate-700">
                        {item.name}
                        {item.detail && (
                          <span className="ml-1 text-tp-slate-400">({item.detail})</span>
                        )}
                      </span>
                    )}
                    {!isTouch && (
                      <span className={cn("flex-shrink-0 transition-opacity", copiedKey === itemKey ? "opacity-100" : "opacity-0 group-hover/voice-item:opacity-100")}>
                        {copiedKey === itemKey ? (
                          <TooltipProvider delayDuration={120}>
                            <Tooltip open>
                              <TooltipTrigger asChild>
                                <span className="vrx-filled-flash inline-flex items-center gap-[3px] text-[12.5px] font-semibold text-tp-success-500">
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                                    <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                  Filled
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top" sideOffset={6} className="rounded-[6px] border-0 bg-tp-slate-900 px-2.5 py-1.5 text-[11.5px] leading-[1.45] text-white shadow-[0_8px_20px_-10px_rgba(15,23,42,0.45)]">
                                {section.title} filled into RxPad
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <ActionableTooltip
                            label={`Fill to RxPad`}
                            onAction={() => handleCopyItem(section.sectionId, item, itemKey)}
                          >
                            <CopyIcon
                              size={14}
                              onClick={() => handleCopyItem(section.sectionId, item, itemKey)}
                            />
                          </ActionableTooltip>
                        )}
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
    </div>
  )

  if (hideHeader) return innerContent

  // Compact "Structured Rx" preview card — same CardShell visuals
  // (white surface, subtle TP-blue shine border, blue-50 icon chip)
  // as the PatientReportedCard, but rendered HEADER-ONLY: the doctor
  // doesn't see the structured items inline here. They tap the
  // Maximize4 icon to flip the panel back into the 3-tab result view
  // with full state preserved.
  // Day + time meta — surfaced under the title so the doctor knows
  // exactly which consult this card belongs to. Today / Yesterday /
  // formatted date, plus the time the structured rx was generated.
  const consultDate = new Date()
  const now = new Date()
  const sameDay =
    consultDate.getFullYear() === now.getFullYear() &&
    consultDate.getMonth() === now.getMonth() &&
    consultDate.getDate() === now.getDate()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const isYesterday =
    consultDate.getFullYear() === yesterday.getFullYear() &&
    consultDate.getMonth() === yesterday.getMonth() &&
    consultDate.getDate() === yesterday.getDate()
  const dayLabel = sameDay
    ? "Today"
    : isYesterday
    ? "Yesterday"
    : consultDate.toLocaleDateString(undefined, { day: "numeric", month: "short" })
  const timeLabel = consultDate.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  })
  const dateMeta = `${dayLabel} · ${timeLabel} · Voice consult`

  return (
    <CardShell
      icon={<DocumentText size={14} variant="Bulk" color="var(--tp-blue-500, #4B4AD5)" />}
      title="Structured Rx"
      date={dateMeta}
      collapsible={false}
      defaultCollapsed
      dataSources={["Voice consultation"]}
      headerExtra={
        <button
          type="button"
          onClick={handleExpand}
          aria-label="Open Structured Rx"
          className="vrx-conv-mode-expand inline-flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-[6px] bg-tp-slate-100 text-tp-slate-700 transition-colors hover:bg-tp-slate-200 hover:text-tp-slate-900 active:scale-[0.94]"
          title="Open Structured Rx"
        >
          <Maximize4 size={12} variant="Linear" />
        </button>
      }
    >
      {/* No body — header-only chip. Click the expand icon above to
          flip back into the 3-tab result view. */}
      <span className="hidden" aria-hidden />
    </CardShell>
  )
}
