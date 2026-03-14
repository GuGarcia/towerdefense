import { describe, it, expect } from "bun:test";
import { createGameParams } from "./GameParams";

describe("GameParams", () => {
  it("returns default params when no overrides", () => {
    const p = createGameParams();
    expect(p.seed).toBe(0);
    expect(p.durationFrames).toBe(60 * 60 * 24 * 365);
    expect(p.player.initialLife).toBe(100);
    expect(p.player.initialAttackSpeed).toBe(2);
    expect(p.economy.upgradeCostBase).toBe(10);
    expect(p.wave.spawnRadius).toBe(600);
    expect(p.wave.bossEveryNWaves).toBe(10);
    expect(p.enemies.base.life).toBe(20);
    expect(p.enemies.rapid.speed).toBe(4);
    expect(p.enemies.boss.damage).toBe(25);
  });

  it("merges overrides with defaults", () => {
    const p = createGameParams({ seed: 42, durationFrames: 1000 });
    expect(p.seed).toBe(42);
    expect(p.durationFrames).toBe(1000);
    expect(p.player.initialLife).toBe(100);
  });

  it("merges nested overrides", () => {
    const p = createGameParams({
      player: { initialLife: 50, initialDamage: 20 },
    });
    expect(p.player.initialLife).toBe(50);
    expect(p.player.initialDamage).toBe(20);
    expect(p.player.initialMaxLife).toBe(100);
  });

  it("returns frozen object", () => {
    const p = createGameParams();
    expect(Object.isFrozen(p)).toBe(true);
    expect(Object.isFrozen(p.player)).toBe(true);
  });
});
