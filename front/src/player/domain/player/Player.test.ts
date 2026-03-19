import { describe, it, expect } from "bun:test";
import {
  createPlayer,
  getShotCooldownFrames,
  takeDamage,
  applyRegen,
  canShoot,
  consumeShotCooldown,
  advanceShotCooldown,
  applyUpgrade,
  getUpgradeLevel,
} from "./Player";
import { UpgradeType } from "./UpgradeType";
import { createGameParams } from "../game/GameParams";

describe("Player", () => {
  it("getShotCooldownFrames converts attacks per second to frames at 60 FPS", () => {
    expect(getShotCooldownFrames({ attackSpeed: 2 })).toBe(30);
    expect(getShotCooldownFrames({ attackSpeed: 20 })).toBe(3);
    expect(getShotCooldownFrames({ attackSpeed: 60 })).toBe(1);
  });

  it("createPlayer sets initial state and can shoot immediately", () => {
    const p = createPlayer({
      life: 100,
      maxLife: 100,
      damage: 10,
      regen: 0.5,
      attackSpeed: 2,
    });
    expect(p.life).toBe(100);
    expect(p.damage).toBe(10);
    expect(p.framesSinceLastShot).toBe(30);
    expect(canShoot(p)).toBe(true);
  });

  it("takeDamage reduces life and does not go below 0", () => {
    const p = createPlayer({
      life: 50,
      maxLife: 100,
      damage: 10,
      regen: 0,
      attackSpeed: 30,
    });
    const hit = takeDamage(p, 30);
    expect(hit.life).toBe(20);
    expect(takeDamage(hit, 100).life).toBe(0);
  });

  it("takeDamage applies armorPercent then armorFixed", () => {
    const p = createPlayer({
      life: 100,
      maxLife: 100,
      damage: 0,
      armorPercent: 50, // 30 -> 15
      armorFixed: 5, // 15 -> 10
      regen: 0,
      attackSpeed: 1,
    });
    const hit = takeDamage(p, 30);
    expect(hit.life).toBe(90);
  });

  it("armorPercent is capped at 99% (never invulnerable)", () => {
    const p = createPlayer({
      life: 100,
      maxLife: 100,
      damage: 0,
      armorPercent: 99,
      armorFixed: 0,
      regen: 0,
      attackSpeed: 1,
    });
    const hit = takeDamage(p, 100);
    expect(hit.life).toBe(99); // 1% of 100 = 1 damage
  });

  it("applyUpgrade ArmorPercent caps at 99", () => {
    const params = createGameParams({ player: { armorPercentStep: 10 } });
    const p = createPlayer({
      life: 100,
      maxLife: 100,
      damage: 10,
      armorPercent: 95,
      regen: 0,
      attackSpeed: 2,
    });
    const after = applyUpgrade(p, UpgradeType.ArmorPercent, params);
    expect(after.armorPercent).toBe(99);
  });

  it("applyRegen caps at maxLife", () => {
    const p = createPlayer({
      life: 98,
      maxLife: 100,
      damage: 10,
      regen: 5,
      attackSpeed: 30,
    });
    const after = applyRegen(p);
    expect(after.life).toBe(100);
  });

  it("canShoot and cooldown", () => {
    const p = createPlayer({
      life: 100,
      maxLife: 100,
      damage: 10,
      regen: 0,
      attackSpeed: 20,
    });
    expect(canShoot(p)).toBe(true);
    const afterShot = consumeShotCooldown(p);
    expect(afterShot.framesSinceLastShot).toBe(0);
    expect(canShoot(afterShot)).toBe(false);
    const one = advanceShotCooldown(afterShot);
    const two = advanceShotCooldown(one);
    const three = advanceShotCooldown(two);
    expect(canShoot(three)).toBe(true);
  });

  it("applyUpgrade increases stats", () => {
    const params = createGameParams();
    const p = createPlayer({
      life: 100,
      maxLife: 100,
      damage: 10,
      regen: 0.1,
      attackSpeed: 2,
    });
    const afterDamage = applyUpgrade(p, UpgradeType.Damage, params);
    expect(afterDamage.damage).toBeGreaterThan(10);
    expect(getUpgradeLevel(afterDamage, UpgradeType.Damage)).toBe(1);

    const afterLife = applyUpgrade(p, UpgradeType.Life, params);
    expect(afterLife.maxLife).toBeGreaterThan(100);

    const afterRegen = applyUpgrade(p, UpgradeType.Regen, params);
    expect(afterRegen.regen).toBeGreaterThan(0.1);

    const afterSpeed = applyUpgrade(p, UpgradeType.AttackSpeed, params);
    expect(afterSpeed.attackSpeed).toBeGreaterThan(2);

    const afterArmor = applyUpgrade(p, UpgradeType.ArmorPercent, params);
    expect(afterArmor.armorPercent).toBeGreaterThan(0);

    const afterArmorFixed = applyUpgrade(p, UpgradeType.ArmorFixed, params);
    expect(afterArmorFixed.armorFixed).toBeGreaterThan(0);

    const afterThorns = applyUpgrade(p, UpgradeType.Thorns, params);
    expect(afterThorns.thornsFixed).toBeGreaterThan(0);
    expect(afterThorns.thornsPercent).toBeGreaterThan(0);

    const afterCritChance = applyUpgrade(p, UpgradeType.CritChance, params);
    expect(afterCritChance.critChance).toBeGreaterThan(0);

    const afterCritDamage = applyUpgrade(p, UpgradeType.CritDamage, params);
    expect(afterCritDamage.critDamagePercent).toBeGreaterThan(150);

    const afterVampirism = applyUpgrade(p, UpgradeType.Vampirism, params);
    expect(afterVampirism.vampirismPercent).toBeGreaterThan(0);

    const afterCashBonus = applyUpgrade(p, UpgradeType.CashBonusPercent, params);
    expect(afterCashBonus.cashBonusPercent).toBeGreaterThan(0);
  });
});
