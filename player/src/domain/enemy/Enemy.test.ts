import { describe, it, expect } from "bun:test";
import {
  createEnemy,
  moveTowardCenter,
  takeDamage,
  isDead,
  distanceToCenter,
  directionTowardCenter,
} from "./Enemy";
import { EnemyArchetype } from "./EnemyArchetype";

describe("Enemy", () => {
  it("createEnemy sets all fields", () => {
    const e = createEnemy({
      x: 100,
      y: 0,
      life: 20,
      speed: 2,
      damage: 5,
      size: 12,
      archetype: EnemyArchetype.Base,
    });
    expect(e.x).toBe(100);
    expect(e.y).toBe(0);
    expect(e.life).toBe(20);
    expect(e.maxLife).toBe(20);
    expect(e.archetype).toBe(EnemyArchetype.Base);
  });

  it("directionTowardCenter returns normalized vector toward origin", () => {
    const { dx, dy } = directionTowardCenter(100, 0);
    expect(dx).toBe(-1);
    expect(dy).toBeCloseTo(0);
    const d2 = directionTowardCenter(10, 10);
    const len = Math.sqrt(d2.dx * d2.dx + d2.dy * d2.dy);
    expect(len).toBeCloseTo(1);
    expect(d2.dx).toBeLessThan(0);
    expect(d2.dy).toBeLessThan(0);
  });

  it("moveTowardCenter moves enemy toward (0,0)", () => {
    const e = createEnemy({
      x: 100,
      y: 0,
      life: 20,
      speed: 2,
      damage: 5,
      size: 12,
    });
    const m = moveTowardCenter(e);
    expect(m.x).toBe(98);
    expect(m.y).toBe(0);
  });

  it("takeDamage reduces life and sets hitFlashFrames", () => {
    const e = createEnemy({
      x: 0,
      y: 0,
      life: 20,
      speed: 0,
      damage: 0,
      size: 10,
    });
    const hit = takeDamage(e, 15);
    expect(hit.life).toBe(5);
    expect(hit.hitFlashFrames).toBe(5);
    expect(takeDamage(hit, 10).life).toBe(0);
  });

  it("isDead is true when life <= 0", () => {
    const e = createEnemy({
      x: 0,
      y: 0,
      life: 5,
      speed: 0,
      damage: 0,
      size: 10,
    });
    expect(isDead(e)).toBe(false);
    expect(isDead(takeDamage(e, 5))).toBe(true);
  });

  it("distanceToCenter", () => {
    const e = createEnemy({
      x: 30,
      y: 40,
      life: 1,
      speed: 0,
      damage: 0,
      size: 0,
    });
    expect(distanceToCenter(e)).toBe(50);
  });
});
