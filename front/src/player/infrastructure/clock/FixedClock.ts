/**
 * Game clock: 60 FPS logical ticks. Two implementations:
 * - setInterval (fixed wall-clock)
 * - requestAnimationFrame (synced to display, fixed timestep)
 */
const MS_PER_FRAME = 1000 / 60;

export type TickCallback = () => void;

/** Classic: one tick every 1/60 s via setInterval. Returns stop function. */
export function createFixedClock(onTick: TickCallback): () => void {
  const id = setInterval(onTick, MS_PER_FRAME);
  return () => clearInterval(id);
}

/**
 * rAF-based clock: runs on requestAnimationFrame but only calls onTick when
 * at least 1/60 s has elapsed (fixed logical step). Better for display sync.
 * Returns stop function.
 */
export function createRafClock(onTick: TickCallback): () => void {
  let last = 0;
  let id = 0;

  function loop(now: number): void {
    id = requestAnimationFrame(loop);
    if (last === 0) last = now;
    const elapsed = now - last;
    if (elapsed >= MS_PER_FRAME) {
      const steps = Math.floor(elapsed / MS_PER_FRAME);
      last += steps * MS_PER_FRAME;
      for (let i = 0; i < steps; i++) onTick();
    }
  }

  id = requestAnimationFrame(loop);
  return () => cancelAnimationFrame(id);
}
