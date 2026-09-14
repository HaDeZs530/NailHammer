/**
 * Rolling frames-per-second meter. Pure and frame-driven so it is testable
 * without a browser: feed it timestamps (ms) from requestAnimationFrame.
 */
export type FpsMeter = {
  /** Record a frame at time `now` (ms). Returns the current FPS estimate. */
  tick: (now: number) => number
  /** Current FPS estimate (0 until at least two frames have been seen). */
  readonly fps: number
}

/**
 * @param windowMs how far back (ms) to average over. 500 ms keeps the readout
 *   steady enough to read while still showing a real drop within half a second.
 */
export function createFpsMeter(windowMs = 500): FpsMeter {
  const frames: number[] = []
  let fps = 0
  return {
    tick(now) {
      frames.push(now)
      const cutoff = now - windowMs
      while (frames.length > 0 && frames[0] < cutoff) frames.shift()
      const span = now - frames[0]
      fps = frames.length > 1 && span > 0 ? ((frames.length - 1) * 1000) / span : 0
      return fps
    },
    get fps() {
      return fps
    },
  }
}
