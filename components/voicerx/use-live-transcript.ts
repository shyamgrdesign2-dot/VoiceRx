"use client"

import { useCallback, useEffect, useRef, useState } from "react"

/**
 * Lightweight Web Speech API wrapper — lets the VoiceRx panel render REAL live
 * transcription while the doctor speaks. Zero dependencies; works in Chrome,
 * Edge, Safari (partial). Gracefully reports unsupported environments so callers
 * can fall back to a scripted demo transcript.
 */

// Shape of the browser-provided SpeechRecognition constructor we expect.
interface SpeechRecognitionResultAlt {
  transcript: string
  confidence: number
}
interface SpeechRecognitionAltResult {
  0: SpeechRecognitionResultAlt
  isFinal: boolean
  length: number
}
interface SpeechRecognitionResultsList {
  length: number
  [i: number]: SpeechRecognitionAltResult
}
interface SpeechRecognitionEventLike {
  resultIndex: number
  results: SpeechRecognitionResultsList
}
interface SpeechRecognitionErrorEventLike {
  error: string
  message?: string
}
interface SpeechRecognitionInstance {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives?: number
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((e: SpeechRecognitionEventLike) => void) | null
  onend: (() => void) | null
  onerror: ((e: SpeechRecognitionErrorEventLike) => void) | null
  onstart: (() => void) | null
}
type SpeechRecognitionCtor = new () => SpeechRecognitionInstance

function getCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export interface UseLiveTranscriptOptions {
  /** Whether recognition should currently be running. */
  enabled: boolean
  /** Pause without tearing down (e.g. manual mute, offline). Final text is preserved. */
  paused?: boolean
  /** BCP-47 language tag. Defaults to English (India). */
  lang?: string
}

export interface UseLiveTranscriptReturn {
  /** Finalised transcript so far — stable text the caller can submit. */
  transcript: string
  /** Words currently being spoken (not yet final). Append visually for "speaking now" feel. */
  interim: string
  /** True when real speech recognition is available in this browser. */
  isSupported: boolean
  /** Latest error, if any (permission denied, network, etc). */
  error: string | null
  /** Manually clear captured text (used at session start). */
  reset: () => void
}

export function useLiveTranscript(opts: UseLiveTranscriptOptions): UseLiveTranscriptReturn {
  const { enabled, paused = false, lang = "en-IN" } = opts
  const [transcript, setTranscript] = useState("")
  const [interim, setInterim] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSupported, setIsSupported] = useState(false)

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const shouldListenRef = useRef(false)
  const restartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const Ctor = getCtor()
    setIsSupported(!!Ctor)
  }, [])

  const reset = useCallback(() => {
    setTranscript("")
    setInterim("")
  }, [])

  useEffect(() => {
    const Ctor = getCtor()
    if (!Ctor) return
    if (!enabled) return

    shouldListenRef.current = !paused

    const rec = new Ctor()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = lang
    rec.maxAlternatives = 1

    rec.onresult = (e) => {
      let finalBits = ""
      let interimBits = ""
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]
        const piece = r[0]?.transcript ?? ""
        if (r.isFinal) finalBits += piece
        else interimBits += piece
      }
      if (finalBits) {
        setTranscript((prev) => {
          // Keep spacing tidy.
          const needsSpace = prev && !prev.endsWith(" ") && !finalBits.startsWith(" ")
          return prev + (needsSpace ? " " : "") + finalBits.trim() + " "
        })
      }
      setInterim(interimBits)
    }

    rec.onerror = (e) => {
      // "no-speech" is expected and harmless — the recognizer simply heard silence.
      // "aborted" means we stopped it ourselves. Both should stay silent in the UI.
      if (e.error === "no-speech" || e.error === "aborted") return
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setError("Microphone access was denied")
      } else if (e.error === "network") {
        setError("Speech recognition is offline")
      } else if (e.error) {
        setError(e.error)
      }
    }

    rec.onend = () => {
      // Chrome ends sessions every ~60s — restart if we still want to listen.
      if (shouldListenRef.current) {
        restartTimeoutRef.current = setTimeout(() => {
          try {
            rec.start()
          } catch {
            /* already started — ignore */
          }
        }, 120)
      }
    }

    try {
      rec.start()
      recognitionRef.current = rec
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start speech recognition")
    }

    return () => {
      shouldListenRef.current = false
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current)
        restartTimeoutRef.current = null
      }
      try {
        rec.onresult = null
        rec.onend = null
        rec.onerror = null
        rec.abort()
      } catch {
        /* ignore */
      }
      recognitionRef.current = null
    }
  }, [enabled, lang]) // paused handled via ref + effect below

  // Pause/resume without tearing down — preserves captured text.
  useEffect(() => {
    shouldListenRef.current = enabled && !paused
    const rec = recognitionRef.current
    if (!rec) return
    if (paused) {
      try {
        rec.stop()
      } catch {
        /* ignore */
      }
      setInterim("")
    }
    // Un-pausing re-triggers onend → auto-restart path above.
  }, [enabled, paused])

  return {
    transcript: transcript.trim(),
    interim: interim.trim(),
    isSupported,
    error,
    reset,
  }
}
