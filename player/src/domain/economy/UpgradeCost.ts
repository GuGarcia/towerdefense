/**
 * Domain service: upgrade cost from level and game params.
 */
import type { UpgradeTypeValue } from "../player/UpgradeType";
import type { GameParams } from "../game/GameParams";

export function getUpgradeCost(
  _upgradeType: UpgradeTypeValue,
  currentLevel: number,
  gameParams: GameParams | undefined
): number {
  const base = gameParams?.economy?.upgradeCostBase ?? 50;
  const factor = gameParams?.economy?.upgradeCostFactor ?? 1.5;
  return Math.floor(base * Math.pow(factor, currentLevel));
}
