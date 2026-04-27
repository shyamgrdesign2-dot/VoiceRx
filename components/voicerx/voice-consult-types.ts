/** How VoiceRx captures audio — chosen before consultation starts. */
export type VoiceConsultKind = "ambient_consultation" | "dictation_consultation"

export const VOICE_CONSULT_LABELS: Record<VoiceConsultKind, string> = {
  ambient_consultation: "Ambient consultation",
  dictation_consultation: "Dictation consultation",
}
