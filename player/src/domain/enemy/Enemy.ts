/**
 * Enemy entity: position, HP, damage, size, archetype.
 */
import type { EnemyArchetypeValue } from "./EnemyArchetype";
import { EnemyArchetype } from "./EnemyArchetype";

export interface Enemy {
  id: number;
  x: number;
  y: number;
  life: number;
  maxLife: number;
  speed: number;
  damage: number;
  size: number;
  archetype: EnemyArchetypeValue;
  /** Frames left to show hit flash (visual feedback). */
  hitFlashFrames?: number;
  /** When true, enemy is stuck on player and no longer moves; deals damage every X frames. */
  stuck?: boolean;
  /** Last frame index when this stuck enemy dealt damage to the player. */
  lastDamageFrame?: number;
}

let nextId = 0;
export function nextEnemyId(): number {
  return (nextId += 1);
}

export interface CreateEnemyParams {
  id?: number;
  x: number;
  y: number;
  life: number;
  maxLife?: number;
  speed: number;
  damage: number;
  size: number;
  archetype?: EnemyArchetypeValue;
}

export function createEnemy(params: CreateEnemyParams): Enemy {
  const { x, y, life, speed, damage, size, archetype } = params;
  return {
    id: params.id ?? nextEnemyId(),
    x,
    y,
    life,
    maxLife: params.maxLife ?? life,
    speed,
    damage,
    size,
    archetype: archetype ?? EnemyArchetype.Base,
  };
}

export function directionTowardCenter(x: number, y: number): { dx: number; dy: number } {
  const d = Math.sqrt(x * x + y * y) || 1;
  return { dx: -x / d, dy: -y / d };
}

export function moveTowardCenter(enemy: Enemy): Enemy {
  if (enemy.stuck) return enemy;
  const { dx, dy } = directionTowardCenter(enemy.x, enemy.y);
  return {
    ...enemy,
    x: enemy.x + dx * enemy.speed,
    y: enemy.y + dy * enemy.speed,
  };
}

export function takeDamage(enemy: Enemy, amount: number): Enemy {
  const life = Math.max(0, enemy.life - amount);
  const hitFlashFrames = amount > 0 ? 5 : (enemy.hitFlashFrames ?? 0);
  return { ...enemy, life, hitFlashFrames };
}

export function isDead(enemy: Enemy): boolean {
  return enemy.life <= 0;
}

export function distanceToCenter(enemy: Enemy): number {
  return Math.sqrt(enemy.x * enemy.x + enemy.y * enemy.y);
}

/** Place (x,y) on the circle of given radius, keeping the same angle from center. */
export function clampToCircleRadius(x: number, y: number, radius: number): { x: number; y: number } {
  const d = Math.sqrt(x * x + y * y) || 1;
  return { x: (x / d) * radius, y: (y / d) * radius };
}
