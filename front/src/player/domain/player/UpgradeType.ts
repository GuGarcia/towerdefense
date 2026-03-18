/**
 * Player upgrade types (constants).
 */
export const UpgradeType = Object.freeze({
  Damage: "damage",
  Life: "life",
  Regen: "regen",
  AttackSpeed: "attackSpeed",
  Range: "range",
  ArmorPercent: "armorPercent",
  ArmorFixed: "armorFixed",
  Thorns: "thorns",
  CritChance: "critChance",
  CritDamage: "critDamage",
  Vampirism: "vampirism",
  CashBonusPercent: "cashBonusPercent",
} as const);

export type UpgradeTypeValue = (typeof UpgradeType)[keyof typeof UpgradeType];
export const UPGRADE_TYPES = Object.values(UpgradeType);
