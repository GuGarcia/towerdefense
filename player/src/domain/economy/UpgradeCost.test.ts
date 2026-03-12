import { describe, it, expect } from "bun:test";
import { getUpgradeCost } from "./UpgradeCost";
import { UpgradeType } from "../player/UpgradeType";
import { createGameParams } from "../game/GameParams";

describe("UpgradeCost", () => {
  it("uses default base and increment when no params", () => {
    expect(getUpgradeCost(UpgradeType.Damage, 0, undefined)).toBe(50);
    expect(getUpgradeCost(UpgradeType.Damage, 1, undefined)).toBe(55);
  });

  it("applies arithmetic formula base + level * increment", () => {
    const params = createGameParams({
      economy: { upgradeCostBase: 100, upgradeCostIncrement: 50 },
    });
    expect(getUpgradeCost(UpgradeType.Damage, 0, params)).toBe(100);
    expect(getUpgradeCost(UpgradeType.Damage, 1, params)).toBe(150);
    expect(getUpgradeCost(UpgradeType.Damage, 2, params)).toBe(200);
  });

  it("floors the result", () => {
    const params = createGameParams({
      economy: { upgradeCostBase: 10, upgradeCostIncrement: 3 },
    });
    const cost = getUpgradeCost(UpgradeType.Life, 3, params);
    expect(Number.isInteger(cost)).toBe(true);
  });
});
