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
  });
});
