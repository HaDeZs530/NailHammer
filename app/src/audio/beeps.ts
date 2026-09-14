export type Sound = 'flush' | 'hit' | 'whiff' | 'fail'

export type GameAudio = {
  /** Call from a user gesture (pointerdown) so iOS lets the AudioContext run. */
  unlock: () => void
  play: (s: Sound) => void
}

/**
 * B01 §7 placeholder audio: three beeps (flush / hit / whiff) and a buzz (fail) via WebAudio, plus the
 * Vibration API where the browser has it (iOS Safari does not — native port gets Core Haptics).
 * DESIGN-OPEN: sound design pass (design doc §9.6).
 */
export function createAudio(): GameAudio {
  let ctx: AudioContext | null = null

  const unlock = () => {
    try {
      ctx ??= new AudioContext()
      if (ctx.state === 'suspended') void ctx.resume()
    } catch {
      ctx = null
    }
  }

  const tone = (freq: number, ms: number, type: OscillatorType, gain: number, slideTo?: number) => {
    if (!ctx || ctx.state !== 'running') return
    const t = ctx.currentTime
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = type
    o.frequency.setValueAtTime(freq, t)
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + ms / 1000)
    g.gain.setValueAtTime(gain, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000)
    o.connect(g).connect(ctx.destination)
    o.start(t)
    o.stop(t + ms / 1000)
  }

  const vibrate = (ms: number) => {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(ms)
  }

  const play = (s: Sound) => {
    switch (s) {
      case 'flush':
        tone(880, 160, 'square', 0.25, 1320)
        vibrate(30)
        break
      case 'hit':
        tone(440, 110, 'square', 0.2)
        vibrate(10)
        break
      case 'whiff':
        tone(220, 90, 'triangle', 0.15, 120)
        break
      case 'fail':
        tone(110, 350, 'sawtooth', 0.25, 60)
        break
    }
  }

  return { unlock, play }
}
