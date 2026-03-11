import { describe, it, expect } from "bun:test";
import {
  getWaveNumberAtFrame,
  getWaveStartFrame,
  getEnemiesToSpawnThisFrame,
} from "./WaveSpawner";
import { createGameParams } from "../game/GameParams";

describe("WaveSpawner", () => {
  const params = createGameParams({
    seed: 12345,
    wave: { baseIntervalFrames: 60, spawnRadius: 500 },
  });

  it("getWaveNumberAtFrame returns 0 for frame 0", () => {
    expect(getWaveNumberAtFrame(0, params)).toBe(0);
  });

  it("getWaveNumberAtFrame returns 1 for first interval", () => {
    expect(getWaveNumberAtFrame(1, params)).toBe(1);
    expect(getWaveNumberAtFrame(60, params)).toBe(1);
    expect(getWaveNumberAtFrame(61, params)).toBe(2);
  });

  it("getWaveStartFrame", () => {
    expect(getWaveStartFrame(1, params)).toBe(1);
    expect(getWaveStartFrame(2, params)).toBe(61);
  });

  it("getEnemiesToSpawnThisFrame returns empty when not wave start frame", () => {
    expect(getEnemiesToSpawnThisFrame(0, params)).toEqual([]);
    expect(getEnemiesToSpawnThisFrame(2, params)).toEqual([]);
    expect(getEnemiesToSpawnThisFrame(60, params)).toEqual([]);
  });

  it("getEnemiesToSpawnThisFrame returns enemies only at wave start", () => {
    const enemies = getEnemiesToSpawnThisFrame(1, params);
    expect(enemies.length).toBeGreaterThan(0);
    expect(enemies.every((e) => e.x !== undefined && e.y !== undefined)).toBe(true);
    const dist = Math.sqrt(enemies[0].x ** 2 + enemies[0].y ** 2);
    expect(dist).toBeCloseTo(500);
  });

  it("spawn is deterministic for same seed and frame", () => {
    const a = getEnemiesToSpawnThisFrame(1, params);
    const b = getEnemiesToSpawnThisFrame(1, params);
    expect(a.length).toBe(b.length);
    for (let i = 0; i < a.length; i++) {
      expect(a[i].x).toBe(b[i].x);
      expect(a[i].y).toBe(b[i].y);
      expect(a[i].life).toBe(b[i].life);
    }
  });

  it("spreadSpawnOverFrames spreads spawn over multiple frames", () => {
    const allAtOnce = createGameParams({
      seed: 999,
      wave: { baseIntervalFrames: 60, spawnRadius: 500 },
    });
    const progressive = createGameParams({
      seed: 999,
      wave: { baseIntervalFrames: 60, spawnRadius: 500, spreadSpawnOverFrames: 60 },
    });
    const totalAtOnce = getEnemiesToSpawnThisFrame(1, allAtOnce).length;
    let totalProgressive = 0;
    for (let f = 1; f <= 60; f++) {
      totalProgressive += getEnemiesToSpawnThisFrame(f, progressive).length;
    }
    expect(totalProgressive).toBe(totalAtOnce);
    expect(getEnemiesToSpawnThisFrame(1, progressive).length).toBeLessThan(totalAtOnce);
  });
});
