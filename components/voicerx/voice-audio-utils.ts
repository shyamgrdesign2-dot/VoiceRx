"use client"

function getAudioContextCtor() {
  if (typeof window === "undefined") return undefined
  return (
    (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext ??
    (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  )
}

function scheduleClose(ctx: AudioContext, delayMs: number) {
  return window.setTimeout(() => {
    ctx.close().catch(() => {})
  }, delayMs)
}

export function playVoiceRxStartSound() {
  try {
    const AC = getAudioContextCtor()
    if (!AC) return

    const ctx = new AC()
    const now = ctx.currentTime
    const master = ctx.createGain()
    master.gain.setValueAtTime(0, now)
    master.gain.linearRampToValueAtTime(0.18, now + 0.01)
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.55)
    master.connect(ctx.destination)

    const tones: Array<[number, number]> = [
      [880, 0],
      [1318.5, 0.06],
    ]

    for (const [freq, delay] of tones) {
      const osc = ctx.createOscillator()
      osc.type = "sine"
      osc.frequency.setValueAtTime(freq, now + delay)
      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0, now + delay)
      gain.gain.linearRampToValueAtTime(1, now + delay + 0.008)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.5)
      osc.connect(gain).connect(master)
      osc.start(now + delay)
      osc.stop(now + delay + 0.55)
    }

    scheduleClose(ctx, 900)
  } catch {
    /* audio synthesis unavailable */
  }
}

export function playVoiceRxErrorSound() {
  try {
    const AC = getAudioContextCtor()
    if (!AC) return

    const ctx = new AC()
    const now = ctx.currentTime
    const master = ctx.createGain()
    master.gain.setValueAtTime(0, now)
    master.gain.linearRampToValueAtTime(0.12, now + 0.01)
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.42)
    master.connect(ctx.destination)

    const tones: Array<[number, number]> = [
      [587.33, 0],
      [466.16, 0.08],
    ]

    for (const [freq, delay] of tones) {
      const osc = ctx.createOscillator()
      osc.type = "triangle"
      osc.frequency.setValueAtTime(freq, now + delay)
      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0, now + delay)
      gain.gain.linearRampToValueAtTime(0.9, now + delay + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.28)
      osc.connect(gain).connect(master)
      osc.start(now + delay)
      osc.stop(now + delay + 0.3)
    }

    scheduleClose(ctx, 700)
  } catch {
    /* audio synthesis unavailable */
  }
}
