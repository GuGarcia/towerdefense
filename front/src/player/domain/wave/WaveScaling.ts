/**
 * Shared wave scaling: one place for difficultyScaling + wave1DifficultyFactor.
 */
import type { GameParams } from "../game/GameParams";

export type WaveStatKey = "life" | "speed" | "damage" | "count";

const DEFAULT_SCALING = { life: 1.1, speed: 1.02, damage: 1.05, count: 1.1 };

/**
 * Returns scaled value for a stat at a given wave (for spawn, HUD, composition).
 */
export function scaleWaveStat(
  gameParams: GameParams,
  waveNumber: number,
  key: WaveStatKey,
  base: number
): number {
  if (waveNumber <= 0) return base;
  const scaling = gameParams.wave.difficultyScaling ?? DEFAULT_SCALING;
  const factor = (scaling[key] as number) ?? 1;
  const wave1Factor = gameParams.wave.wave1DifficultyFactor ?? 1;
  const value = base * Math.pow(factor, waveNumber - 1);
  return waveNumber === 1 ? value * wave1Factor : value;
}
