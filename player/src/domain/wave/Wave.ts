/**
 * Wave: number, boss flag.
 */
import type { GameParams } from "../game/GameParams";

export interface Wave {
  number: number;
  isBoss: boolean;
}

export function createWave(number: number, isBoss?: boolean): Wave {
  return { number, isBoss: !!isBoss };
}

export function isBossWave(waveNumber: number, gameParams?: GameParams): boolean {
  const n = gameParams?.wave?.bossEveryNWaves ?? 10;
  return n > 0 && waveNumber > 0 && waveNumber % n === 0;
}
