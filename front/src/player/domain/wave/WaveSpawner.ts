/**
 * Deterministic service: enemy spawn from seed + frame + GameParams.
 */
import type { Enemy } from "../enemy/Enemy";
import type { GameParams } from "../game/GameParams";
import { EnemyArchetype, type EnemyArchetypeValue } from "../enemy/EnemyArchetype";
import { createEnemy, nextEnemyId } from "../enemy/Enemy";
import { scaleWaveStat } from "./WaveScaling";
import { isBossWave } from "./Wave";

function createRng(seed: number): () => number {
  let s = seed;
  return function () {
    let t = (s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Returns the k-th random number from the sequence (0-based), for deterministic spawn order. */
function getKthRandom(seed: number, k: number): number {
  const rng = createRng(seed);
  let v = 0;
  for (let i = 0; i <= k; i++) v = rng();
  return v;
}

export function getWaveNumberAtFrame(frameIndex: number, gameParams?: GameParams): number {
  const interval = gameParams?.wave?.baseIntervalFrames ?? 60 * 5;
  if (frameIndex <= 0) return 0;
  return Math.floor((frameIndex - 1) / interval) + 1;
}

export function getWaveStartFrame(waveNumber: number, gameParams?: GameParams): number {
  const interval = gameParams?.wave?.baseIntervalFrames ?? 60 * 5;
  return (waveNumber - 1) * interval + 1;
}

/** Returns scaled enemy stats per archetype for a given wave (for HUD "Ennemis vague X"). */
export function getWaveEnemyStats(
  gameParams: GameParams,
  waveNumber: number
): {
  base: { life: number; speed: number; damage: number; size: number; count: number };
  rapid: { life: number; speed: number; damage: number; size: number; count: number };
  boss: { life: number; speed: number; damage: number; size: number; count: number };
} {
  if (waveNumber <= 0) waveNumber = 1;
  const scale = (key: "life" | "speed" | "damage" | "count", base: number) =>
    scaleWaveStat(gameParams, waveNumber, key, base);
  const b = gameParams.enemies.base;
  const r = gameParams.enemies.rapid;
  const boss = gameParams.enemies.boss;
  const bossCount = isBossWave(waveNumber, gameParams) ? Math.min(1, Math.floor(scale("count", boss?.countPerWave ?? 0))) : 0;
  return {
    base: {
      life: scale("life", b?.life ?? 0),
      speed: scale("speed", b?.speed ?? 0),
      damage: scale("damage", b?.damage ?? 0),
      size: b?.size ?? 12,
      count: Math.floor(scale("count", b?.countPerWave ?? 0)),
    },
    rapid: {
      life: scale("life", r?.life ?? 0),
      speed: scale("speed", r?.speed ?? 0),
      damage: scale("damage", r?.damage ?? 0),
      size: r?.size ?? 6,
      count: Math.floor(scale("count", r?.countPerWave ?? 0)),
    },
    boss: {
      life: scale("life", boss?.life ?? 0),
      speed: scale("speed", boss?.speed ?? 0),
      damage: scale("damage", boss?.damage ?? 0),
      size: boss?.size ?? 32,
      count: bossCount,
    },
  };
}

/** Returns the composition (count per archetype) for a given wave number (for UI: "Prochaine vague"). */
export function getWaveComposition(
  gameParams: GameParams,
  waveNumber: number
): { base: number; rapid: number; boss: number } {
  if (waveNumber <= 0) return { base: 0, rapid: 0, boss: 0 };
  const baseConfig = gameParams.enemies.base;
  const rapidConfig = gameParams.enemies.rapid;
  const bossConfig = gameParams.enemies.boss;
  const base = Math.floor(scaleWaveStat(gameParams, waveNumber, "count", baseConfig?.countPerWave ?? 0));
  const rapid = Math.floor(scaleWaveStat(gameParams, waveNumber, "count", rapidConfig?.countPerWave ?? 0));
  const boss = isBossWave(waveNumber, gameParams)
    ? Math.min(1, Math.floor(scaleWaveStat(gameParams, waveNumber, "count", bossConfig?.countPerWave ?? 0)))
    : 0;
  return { base, rapid, boss };
}

export function getEnemiesToSpawnThisFrame(frameIndex: number, gameParams: GameParams): Enemy[] {
  const waveNumber = getWaveNumberAtFrame(frameIndex, gameParams);
  if (waveNumber <= 0) return [];

  const waveStart = getWaveStartFrame(waveNumber, gameParams);
  const spreadFrames = gameParams.wave.spreadSpawnOverFrames ?? 0;

  const radius = gameParams.wave.spawnRadius ?? 600;

  const archetypes: EnemyArchetypeValue[] = [EnemyArchetype.Base, EnemyArchetype.Rapid];
  if (isBossWave(waveNumber, gameParams)) archetypes.push(EnemyArchetype.Boss);

  const counts: number[] = [];
  for (const archetype of archetypes) {
    const config = gameParams.enemies[archetype];
    if (!config) {
      counts.push(0);
      continue;
    }
    let count = Math.floor(scaleWaveStat(gameParams, waveNumber, "count", config.countPerWave ?? 1));
    if (archetype === EnemyArchetype.Boss) count = Math.min(1, count);
    counts.push(count);
  }
  const totalSlots = counts.reduce((a, c) => a + c, 0);
  if (totalSlots <= 0) return [];

  let spawnThisFrame: boolean;
  let offset: number;
  if (spreadFrames <= 0) {
    spawnThisFrame = frameIndex === waveStart;
    offset = 0;
  } else {
    offset = frameIndex - waveStart;
    spawnThisFrame = offset >= 0 && offset < spreadFrames;
  }
  if (!spawnThisFrame) return [];

  const enemies: Enemy[] = [];
  let slotIndex = 0;
  for (let a = 0; a < archetypes.length; a++) {
    const archetype = archetypes[a];
    const config = gameParams.enemies[archetype];
    if (!config) continue;
    const count = counts[a];
    for (let i = 0; i < count; i++) {
      const slotSpawnOffset =
        spreadFrames <= 0 ? 0 : Math.floor((slotIndex * spreadFrames) / totalSlots);
      if (slotSpawnOffset !== offset) {
        slotIndex++;
        continue;
      }
      const angle = getKthRandom(gameParams.seed + waveStart * 7919, slotIndex) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const life = scaleWaveStat(gameParams, waveNumber, "life", config.life);
      const speed = scaleWaveStat(gameParams, waveNumber, "speed", config.speed);
      const damage = scaleWaveStat(gameParams, waveNumber, "damage", config.damage);
      const size = config.size ?? 12;
      enemies.push(
        createEnemy({
          id: nextEnemyId(),
          x,
          y,
          life,
          maxLife: life,
          speed,
          damage,
          size,
          archetype,
        })
      );
      slotIndex++;
    }
  }

  return enemies;
}

export { createWave, isBossWave } from "./Wave";
