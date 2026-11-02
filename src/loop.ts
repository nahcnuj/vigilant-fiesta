/** Milliseconds between automatic drops at the given level. */
export function dropIntervalMs(level: number): number {
  return Math.max(120, 700 - (level - 1) * 50);
}

export interface DropAdvance {
  /** Number of ticks to run this frame (bounded by maxTicks). */
  ticks: number;
  /** Accumulated time left for the next frame. */
  remainderMs: number;
}

/**
 * Convert elapsed time into a bounded number of drop ticks.
 *
 * A long frame (background tab, GC pause, slow render) must not turn into an
 * unbounded burst of ticks: that stalls the loop further and can freeze the
 * game. The backlog is carried forward instead of discarded, so the game makes
 * steady progress over time.
 */
export function advanceDrop(
  accMs: number,
  deltaMs: number,
  intervalMs: number,
  maxTicks = 10,
): DropAdvance {
  let acc = accMs + deltaMs;
  let ticks = 0;
  while (acc >= intervalMs && ticks < maxTicks) {
    acc -= intervalMs;
    ticks++;
  }
  // If the frame was so long that the tick cap was hit, discard the remaining
  // whole intervals so a single slow frame cannot create a sustained
  // catch-up burst of ticks over the following frames (which freezes the
  // game during long play). Keep only the sub-interval remainder.
  if (ticks === maxTicks && acc >= intervalMs) {
    acc = acc % intervalMs;
  }
  return { ticks, remainderMs: acc };
}
