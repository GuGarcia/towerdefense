/**
 * Player entity: life, stats, upgrade levels.
 * attackSpeed is stored as attacks per second (APS); cooldown in frames is derived at 60 FPS.
 */
import type { UpgradeTypeValue } from "./UpgradeType";
import { UpgradeType } from "./UpgradeType";
import type { GameParams } from "../game/GameParams";

const FPS = 60;

export interface Player {
  life: number;
  maxLife: number;
  damage: number;
  regen: number;
  /** Attacks per second (APS). */
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

/** Returns cooldown in frames between shots (60 FPS). Min 1 frame (max 60 APS). */
export function getShotCooldownFrames(player: { attackSpeed: number }): number {
  if (player.attackSpeed <= 0) return FPS;
  return Math.max(1, Math.ceil(FPS / player.attackSpeed));
}

export function createPlayer(initial: PlayerInitial): Player {
  const { life, maxLife, damage, regen, attackSpeed } = initial;
  const cooldown = getShotCooldownFrames(initial);
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
    framesSinceLastShot: cooldown,
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
  return player.framesSinceLastShot >= getShotCooldownFrames(player);
}

export function consumeShotCooldown(player: Player): Player {
  return { ...player, framesSinceLastShot: 0 };
}

export function advanceShotCooldown(player: Player): Player {
  const cooldown = getShotCooldownFrames(player);
  return {
    ...player,
    framesSinceLastShot: Math.min(cooldown, player.framesSinceLastShot + 1),
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
      const delta = (params?.player?.initialAttackSpeed ?? 2) * 0.15;
      const newSpeed = Math.min(60, player.attackSpeed + delta);
      return { ...player, attackSpeed: newSpeed, upgradeLevels: levels };
    }
    default:
      return { ...player, upgradeLevels: levels };
  }
}

export function getUpgradeLevel(player: Player, upgradeType: UpgradeTypeValue): number {
  return player.upgradeLevels[upgradeType] ?? 0;
}
