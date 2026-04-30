"use client"

import React from "react"

import RxpadHeader from "@/components/tp-rxpad/imports/RxpadHeader"
import type { VoiceConsultKind } from "@/components/voicerx/voice-consult-types"

export interface TPRxPadTopNavProps {
  className?: string
  onBack?: () => void
  onVisitSummary?: () => void
  onPreview?: () => void
  onCustomise?: () => void
  onEndVisit?: () => void
  onSaveDraft?: () => void
  voiceCaptureMode?: VoiceConsultKind | null
  patientName?: string
  patientMeta?: string
}

export function TPRxPadTopNav({
  className,
  onBack,
  onVisitSummary,
  onPreview,
  onCustomise,
  onEndVisit,
  onSaveDraft,
  voiceCaptureMode = null,
  patientName,
  patientMeta,
}: TPRxPadTopNavProps) {
  return (
    <RxpadHeader
      className={className}
      onBack={onBack}
      onVisitSummary={onVisitSummary}
      onPreview={onPreview}
      onCustomise={onCustomise}
      onEndVisit={onEndVisit}
      onSaveDraft={onSaveDraft}
      voiceCaptureMode={voiceCaptureMode}
      patientName={patientName}
      patientMeta={patientMeta}
    />
  )
}
