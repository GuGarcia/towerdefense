import { describe, it, expect } from "bun:test";
import { createWave, isBossWave } from "./Wave";
import { createGameParams } from "../game/GameParams";

describe("Wave", () => {
  it("createWave sets number and isBoss", () => {
    expect(createWave(1)).toEqual({ number: 1, isBoss: false });
    expect(createWave(10, true)).toEqual({ number: 10, isBoss: true });
  });

  it("isBossWave returns true every N waves", () => {
    const params = createGameParams({ wave: { bossEveryNWaves: 10 } });
    expect(isBossWave(10, params)).toBe(true);
    expect(isBossWave(20, params)).toBe(true);
    expect(isBossWave(9, params)).toBe(false);
    expect(isBossWave(11, params)).toBe(false);
  });

  it("isBossWave returns false for wave 0", () => {
    const params = createGameParams();
    expect(isBossWave(0, params)).toBe(false);
  });
});
