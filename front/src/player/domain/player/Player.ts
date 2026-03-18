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
  /** Reduction percentage applied before fixed armor. */
  armorPercent: number;
  /** Fixed damage reduction applied after armorPercent. */
  armorFixed: number;
  /** Damage dealt back to enemies when they hit the player (thorns). */
  thornsFixed: number;
  /** Additional thorns as % of damage received by the player. */
  thornsPercent: number;
  /** Chance (0-100) that a shot is critical. Deterministic per shot. */
  critChance: number;
  /** Crit damage multiplier in percent (ex: 150 => x1.5). */
  critDamagePercent: number;
  regen: number;
  /** Attacks per second (APS). */
  attackSpeed: number;
  /** Shooting range (distance from center); only enemies within this range can be targeted. */
  range: number;
  upgradeLevels: Record<UpgradeTypeValue, number>;
  framesSinceLastShot: number;
}

export interface PlayerInitial {
  life: number;
  maxLife: number;
  damage: number;
  armorPercent?: number;
  armorFixed?: number;
  thornsFixed?: number;
  thornsPercent?: number;
  critChance?: number;
  critDamagePercent?: number;
  regen: number;
  attackSpeed: number;
  /** Shooting range; default 300 if omitted. */
  range?: number;
}

/** Returns cooldown in frames between shots (60 FPS). Min 1 frame (max 60 APS). */
export function getShotCooldownFrames(player: { attackSpeed: number }): number {
  if (player.attackSpeed <= 0) return FPS;
  return Math.max(1, Math.ceil(FPS / player.attackSpeed));
}

export function createPlayer(initial: PlayerInitial): Player {
  const {
    life,
    maxLife,
    damage,
    regen,
    attackSpeed,
    armorPercent = 0,
    armorFixed = 0,
    thornsFixed = 0,
    thornsPercent = 0,
    critChance = 0,
    critDamagePercent = 150,
    range = 300,
  } = initial;
  const cooldown = getShotCooldownFrames(initial);
  return {
    life,
    maxLife,
    damage,
    armorPercent,
    armorFixed,
    thornsFixed,
    thornsPercent,
    critChance,
    critDamagePercent,
    regen,
    attackSpeed,
    range,
    upgradeLevels: {
      [UpgradeType.Damage]: 0,
      [UpgradeType.Life]: 0,
      [UpgradeType.Regen]: 0,
      [UpgradeType.AttackSpeed]: 0,
      [UpgradeType.Range]: 0,
      [UpgradeType.ArmorPercent]: 0,
      [UpgradeType.ArmorFixed]: 0,
      [UpgradeType.Thorns]: 0,
      [UpgradeType.CritChance]: 0,
      [UpgradeType.CritDamage]: 0,
    },
    framesSinceLastShot: cooldown,
  };
}

export function takeDamage(player: Player, amount: number): Player {
  // Order: apply % armor, then apply fixed armor.
  const afterPct = amount * (1 - (player.armorPercent ?? 0) / 100);
  const afterFixed = Math.max(0, afterPct - (player.armorFixed ?? 0));
  return { ...player, life: Math.max(0, player.life - afterFixed) };
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

  const p = params?.player;
  const f = {
    damage: p?.upgradeFactorDamage ?? 0.15,
    life: p?.upgradeFactorLife ?? 0.1,
    regen: p?.upgradeFactorRegen ?? 0.5,
    attackSpeed: p?.upgradeFactorAttackSpeed ?? 0.15,
    range: p?.upgradeFactorRange ?? 0.15,
  };

  switch (upgradeType) {
    case UpgradeType.Damage: {
      const delta = (p?.initialDamage ?? 10) * f.damage;
      return { ...player, damage: player.damage + delta, upgradeLevels: levels };
    }
    case UpgradeType.Life: {
      const delta = (p?.initialMaxLife ?? 100) * f.life;
      const newMax = player.maxLife + delta;
      return { ...player, maxLife: newMax, life: Math.min(player.life + delta, newMax), upgradeLevels: levels };
    }
    case UpgradeType.Regen: {
      const delta = (p?.initialRegen ?? 0.1) * f.regen;
      return { ...player, regen: player.regen + delta, upgradeLevels: levels };
    }
    case UpgradeType.AttackSpeed: {
      const delta = (p?.initialAttackSpeed ?? 2) * f.attackSpeed;
      const newSpeed = Math.min(60, player.attackSpeed + delta);
      return { ...player, attackSpeed: newSpeed, upgradeLevels: levels };
    }
    case UpgradeType.Range: {
      const delta = (p?.initialRange ?? 300) * f.range;
      return { ...player, range: player.range + delta, upgradeLevels: levels };
    }
    case UpgradeType.ArmorPercent: {
      const delta = p?.armorPercentStep ?? 5;
      return { ...player, armorPercent: player.armorPercent + delta, upgradeLevels: levels };
    }
    case UpgradeType.ArmorFixed: {
      const delta = p?.armorFixedStep ?? 2;
      return { ...player, armorFixed: player.armorFixed + delta, upgradeLevels: levels };
    }
    case UpgradeType.Thorns: {
      const deltaFixed = p?.thornsFixedStep ?? 2;
      const deltaPercent = p?.thornsPercentStep ?? 5;
      return {
        ...player,
        thornsFixed: player.thornsFixed + deltaFixed,
        thornsPercent: player.thornsPercent + deltaPercent,
        upgradeLevels: levels,
      };
    }
    case UpgradeType.CritChance: {
      const delta = p?.critChanceStep ?? 5;
      const next = Math.max(0, Math.min(99, player.critChance + delta));
      return { ...player, critChance: next, upgradeLevels: levels };
    }
    case UpgradeType.CritDamage: {
      const delta = p?.critDamagePercentStep ?? 10;
      return { ...player, critDamagePercent: player.critDamagePercent + delta, upgradeLevels: levels };
    }
    default:
      return { ...player, upgradeLevels: levels };
  }
}

export function getUpgradeLevel(player: Player, upgradeType: UpgradeTypeValue): number {
  return player.upgradeLevels[upgradeType] ?? 0;
}
