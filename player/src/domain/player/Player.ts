/**
 * Player entity: life, stats, upgrade levels.
 */
import type { UpgradeTypeValue } from "./UpgradeType";
import { UpgradeType } from "./UpgradeType";
import type { GameParams } from "../game/GameParams";

export interface Player {
  life: number;
  maxLife: number;
  damage: number;
  regen: number;
  attackSpeed: number;
  upgradeLevels: Record<UpgradeTypeValue, number>;
  framesSinceLastShot: number;
}

export interface PlayerInitial {
  life: number;
  maxLife: number;
  damage: number;
  regen: number;
  attackSpeed: number;
}

export function createPlayer(initial: PlayerInitial): Player {
  const { life, maxLife, damage, regen, attackSpeed } = initial;
  return {
    life,
    maxLife,
    damage,
    regen,
    attackSpeed,
    upgradeLevels: {
      [UpgradeType.Damage]: 0,
      [UpgradeType.Life]: 0,
      [UpgradeType.Regen]: 0,
      [UpgradeType.AttackSpeed]: 0,
    },
    framesSinceLastShot: attackSpeed,
  };
}

export function takeDamage(player: Player, amount: number): Player {
  return { ...player, life: Math.max(0, player.life - amount) };
}

export function applyRegen(player: Player, _params?: GameParams): Player {
  const newLife = Math.min(player.maxLife, player.life + player.regen);
  return { ...player, life: newLife };
}

export function canShoot(player: Player): boolean {
  return player.framesSinceLastShot >= player.attackSpeed;
}

export function consumeShotCooldown(player: Player): Player {
  return { ...player, framesSinceLastShot: 0 };
}

export function advanceShotCooldown(player: Player): Player {
  return {
    ...player,
    framesSinceLastShot: Math.min(player.attackSpeed, player.framesSinceLastShot + 1),
  };
}

export function applyUpgrade(player: Player, upgradeType: UpgradeTypeValue, params?: GameParams): Player {
  const level = player.upgradeLevels[upgradeType] ?? 0;
  const nextLevel = level + 1;
  const levels = { ...player.upgradeLevels, [upgradeType]: nextLevel };

  switch (upgradeType) {
    case UpgradeType.Damage: {
      const delta = (params?.player?.initialDamage ?? 10) * 0.15;
      return { ...player, damage: player.damage + delta, upgradeLevels: levels };
    }
    case UpgradeType.Life: {
      const delta = (params?.player?.initialMaxLife ?? 100) * 0.1;
      const newMax = player.maxLife + delta;
      return { ...player, maxLife: newMax, life: Math.min(player.life + delta, newMax), upgradeLevels: levels };
    }
    case UpgradeType.Regen: {
      const delta = (params?.player?.initialRegen ?? 0.1) * 0.5;
      return { ...player, regen: player.regen + delta, upgradeLevels: levels };
    }
    case UpgradeType.AttackSpeed: {
      const newSpeed = Math.max(5, Math.floor(player.attackSpeed * 0.92));
      return { ...player, attackSpeed: newSpeed, upgradeLevels: levels };
    }
    default:
      return { ...player, upgradeLevels: levels };
  }
}

export function getUpgradeLevel(player: Player, upgradeType: UpgradeTypeValue): number {
  return player.upgradeLevels[upgradeType] ?? 0;
}
