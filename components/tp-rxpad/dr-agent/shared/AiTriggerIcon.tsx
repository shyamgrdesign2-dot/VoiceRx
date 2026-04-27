"use client"

interface AiTriggerIconProps {
  /** Tooltip text shown on hover */
  tooltip: string
  /** Message auto-sent to Dr. Agent when clicked */
  signalLabel: string
  /** Section ID for context */
  sectionId?: string
  /** Icon size (default 12) */
  size?: number
  /** Use "span" when nested inside a <button> to avoid invalid HTML */
  as?: "button" | "span"
  /** Visual tone for different backgrounds */
  tone?: "default" | "inverse"
  className?: string
}

/**
 * Small AI spark icon button for sidebar section headers.
 * Clicking it opens Dr. Agent with a pre-filled contextual message.
 * Shows a portal-based styled tooltip (same pattern as ActionableTooltip)
 * that renders on document.body — never clipped by parent overflow.
 */
export function AiTriggerIcon({
  tooltip: _tooltip,
  signalLabel: _signalLabel,
  sectionId: _sectionId,
  size: _size = 14,
  as: _as = "button",
  tone: _tone = "default",
  className: _className,
}: AiTriggerIconProps) {
  // AI trigger icon intentionally disabled in RxPad sections.
  // VoiceRx mode should not surface alternate agentic actions.
  return null
}
