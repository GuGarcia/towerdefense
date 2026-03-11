import { describe, it, expect } from "bun:test";
import { getUpgradeCost } from "./UpgradeCost";
import { UpgradeType } from "../player/UpgradeType";
import { createGameParams } from "../game/GameParams";

describe("UpgradeCost", () => {
  it("uses default base and factor when no params", () => {
    expect(getUpgradeCost(UpgradeType.Damage, 0, undefined)).toBe(50);
    expect(getUpgradeCost(UpgradeType.Damage, 1, undefined)).toBe(75);
  });

  it("applies formula base * factor^level", () => {
    const params = createGameParams({
      economy: { upgradeCostBase: 100, upgradeCostFactor: 2 },
    });
    expect(getUpgradeCost(UpgradeType.Damage, 0, params)).toBe(100);
    expect(getUpgradeCost(UpgradeType.Damage, 1, params)).toBe(200);
    expect(getUpgradeCost(UpgradeType.Damage, 2, params)).toBe(400);
  });

  it("floors the result", () => {
    const params = createGameParams({
      economy: { upgradeCostBase: 10, upgradeCostFactor: 1.3 },
    });
    const cost = getUpgradeCost(UpgradeType.Life, 3, params);
    expect(Number.isInteger(cost)).toBe(true);
  });
});
