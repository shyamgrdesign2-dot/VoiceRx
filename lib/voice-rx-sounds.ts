/**
 * Tiny synthesized UI sounds for the VoiceRx flow.
 *
 * No external assets — we generate quick tone pairs through the Web
 * Audio API so the bundle stays light and the sound plays
 * deterministically across devices. Volume is intentionally low and
 * the sound respects `prefers-reduced-motion` (treated as a hint to
 * skip non-essential audio cues too).
 */

let ctx: AudioContext | null = null

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null
  if (ctx && ctx.state !== "closed") return ctx
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Ctor: typeof AudioContext | undefined =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  try {
    ctx = new Ctor()
  } catch {
    return null
  }
  return ctx
}

function shouldPlay(): boolean {
  if (typeof window === "undefined") return false
  const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)")
  return !mq?.matches
}

function tone(freq: number, startOffset: number, duration: number, gain = 0.06) {
  const audio = getContext()
  if (!audio) return
  const now = audio.currentTime + startOffset
  const osc = audio.createOscillator()
  const g = audio.createGain()
  osc.type = "sine"
  osc.frequency.setValueAtTime(freq, now)
  g.gain.setValueAtTime(0, now)
  g.gain.linearRampToValueAtTime(gain, now + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, now + duration)
  osc.connect(g)
  g.connect(audio.destination)
  osc.start(now)
  osc.stop(now + duration + 0.02)
}

/**
 * Submit confirmation tone — two-note ascending blip (~180ms total).
 * Played on a successful Submit press from the active agent.
 */
export function playSubmitSound() {
  if (!shouldPlay()) return
  // Resume the context if the browser auto-suspended it (autoplay
  // policy) — submit is a user gesture, so resume() succeeds here.
  const audio = getContext()
  if (audio?.state === "suspended") void audio.resume()
  tone(680, 0, 0.12, 0.05)
  tone(960, 0.07, 0.14, 0.05)
}
