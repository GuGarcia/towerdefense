/**
 * Domain service: upgrade cost from level and game params.
 */
import type { UpgradeTypeValue } from "../player/UpgradeType";
import type { GameParams } from "../game/GameParams";

/** Cost to upgrade from currentLevel to currentLevel+1. Arithmetic: base + currentLevel * increment. */
export function getUpgradeCost(
  _upgradeType: UpgradeTypeValue,
  currentLevel: number,
  gameParams: GameParams | undefined
): number {
  const base = gameParams?.economy?.upgradeCostBase ?? 50;
  const increment = gameParams?.economy?.upgradeCostIncrement ?? 5;
  return Math.floor(base + currentLevel * increment);
}
