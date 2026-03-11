/**
 * Emits a tick every 1/60 s (60 FPS). Returns a stop function.
 */
const MS_PER_FRAME = 1000 / 60;

export type TickCallback = () => void;

export function createFixedClock(onTick: TickCallback): () => void {
  const id = setInterval(onTick, MS_PER_FRAME);
  return () => clearInterval(id);
}
