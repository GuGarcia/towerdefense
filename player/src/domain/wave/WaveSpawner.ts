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
  if (frameIndex !== waveStart) return [];

  const radius = gameParams.wave.spawnRadius ?? 600;
  const scaling = gameParams.wave.difficultyScaling ?? { life: 1.1, speed: 1.02, damage: 1.05, count: 1.1 };
  const scale = (key: keyof typeof scaling, base: number, w: number) =>
    base * Math.pow((scaling[key] as number) ?? 1, w - 1);

  const rng = createRng(gameParams.seed + frameIndex * 7919);
  const enemies: Enemy[] = [];
  const archetypes: EnemyArchetypeValue[] = [EnemyArchetype.Base, EnemyArchetype.Rapid];
  if (isBossWave(waveNumber, gameParams)) archetypes.push(EnemyArchetype.Boss);

  for (const archetype of archetypes) {
    const config = gameParams.enemies[archetype];
    if (!config) continue;
    let count = Math.floor(scale("count", config.countPerWave ?? 1, waveNumber));
    if (archetype === EnemyArchetype.Boss) count = Math.min(1, count);
    for (let i = 0; i < count; i++) {
      const angle = rng() * Math.PI * 2;
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
    }
  }

  return enemies;
}

export { createWave, isBossWave } from "./Wave";
