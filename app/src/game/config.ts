/**
 * §2.2 starting numbers (design doc, LOCKED 2026-09-14). All tunable from here and nowhere else.
 * Every value is asserted by `config.test.ts` — NEVER #9: no number ships without a test.
 */
export const config = {
  /** Commit threshold: px of downward finger travel after any upward travel. */
  commitThresholdPx: 12,
  /** Commit → impact delay, ms. */
  commitToImpactMs: 140,
  /** Hit window: ± ms around the moment the nail centre is under the hammer. */
  hitWindowMs: 55,
  /** Flush (perfect) window: ± ms. Bonus + bigger sound. */
  flushWindowMs: 20,
  /** Reset to neutral, ms. */
  resetMs: 120,
  /** Next windup accepted from this many ms into reset. */
  resetAcceptWindupMs: 40,
  /** Windup cap: px of finger travel. */
  windupCapPx: 320,
  /** Nail width, px. */
  nailWidthPx: 64,
  /** Scroll speed, level 1: one nail width per this many ms (= 160 px/s). */
  scrollMsPerNailLevel1: 400,
  /** Restart after fail: max ms from fail to first frame of the new attempt. */
  restartMaxMs: 500,
} as const

/** Derived: level-1 scroll speed in px/s (§2.2 says 160 px/s). */
export const scrollPxPerSecLevel1 = (config.nailWidthPx * 1000) / config.scrollMsPerNailLevel1

/**
 * Not in §2.2. Each one is a placeholder named in the PR.
 */
export const placeholder = {
  // DESIGN-OPEN: hammer head width. Assumed = nail width, so "nail head overlaps hammer" means the
  // nail centre is within one nail width of the hammer centre at impact.
  hammerWidthPx: 64,
  // DESIGN-OPEN: empty run-in before the first nail of level 1 (256 px = 1.6 s at level-1 speed).
  leadInPx: 256,
  // DESIGN-OPEN: run-out after the last nail before the progress bar reads 100 %.
  tailPx: 128,
} as const
