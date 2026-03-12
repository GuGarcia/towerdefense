/**
 * Deterministic service: enemy spawn from seed + frame + GameParams.
 */
import type { Enemy } from "../enemy/Enemy";
import type { GameParams } from "../game/GameParams";
import { EnemyArchetype, type EnemyArchetypeValue } from "../enemy/EnemyArchetype";
import { createEnemy, nextEnemyId } from "../enemy/Enemy";
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

export function getEnemiesToSpawnThisFrame(frameIndex: number, gameParams: GameParams): Enemy[] {
  const waveNumber = getWaveNumberAtFrame(frameIndex, gameParams);
  if (waveNumber <= 0) return [];

  const waveStart = getWaveStartFrame(waveNumber, gameParams);
  const spreadFrames = gameParams.wave.spreadSpawnOverFrames ?? 0;

  const radius = gameParams.wave.spawnRadius ?? 600;
  const scaling = gameParams.wave.difficultyScaling ?? { life: 1.1, speed: 1.02, damage: 1.05, count: 1.1 };
  const wave1Factor = gameParams.wave.wave1DifficultyFactor ?? 1;
  const scale = (key: keyof typeof scaling, base: number, w: number) => {
    const value = base * Math.pow((scaling[key] as number) ?? 1, w - 1);
    return w === 1 ? value * wave1Factor : value;
  };

  const archetypes: EnemyArchetypeValue[] = [EnemyArchetype.Base, EnemyArchetype.Rapid];
  if (isBossWave(waveNumber, gameParams)) archetypes.push(EnemyArchetype.Boss);

  const counts: number[] = [];
  for (const archetype of archetypes) {
    const config = gameParams.enemies[archetype];
    if (!config) {
      counts.push(0);
      continue;
    }
    let count = Math.floor(scale("count", config.countPerWave ?? 1, waveNumber));
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
      const life = scale("life", config.life, waveNumber);
      const speed = scale("speed", config.speed, waveNumber);
      const damage = scale("damage", config.damage, waveNumber);
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
