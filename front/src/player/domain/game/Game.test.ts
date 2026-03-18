import { describe, it, expect } from "bun:test";
import { createGame, tick } from "./Game";
import { createGameParams } from "./GameParams";
import { GameState } from "./GameState";
import { UpgradeType, type UpgradeTypeValue } from "../player/UpgradeType";
import { createEnemy } from "../enemy/Enemy";
import { EnemyArchetype } from "../enemy/EnemyArchetype";

describe("Game", () => {
  it("createGame initializes with params and Playing state", () => {
    const params = createGameParams({ seed: 999 });
    const game = createGame(params);
    expect(game.state).toBe(GameState.Playing);
    expect(game.params.seed).toBe(999);
    expect(game.player.life).toBe(params.player.initialLife);
    expect(game.enemies).toEqual([]);
    expect(game.projectiles).toEqual([]);
    expect(game.money).toBe(0);
    expect(game.coinsEarned).toBe(0);
  });

  it("tick without input advances state (spawn, move)", () => {
    const params = createGameParams({
      seed: 1,
      wave: { baseIntervalFrames: 2 },
    });
    let game = createGame(params);
    game = tick(game, 0);
    expect(game.frameIndex).toBe(0);
    game = tick(game, 1);
    expect(game.enemies.length).toBeGreaterThan(0);
    const beforeX = game.enemies[0].x;
    game = tick(game, 2);
    expect(game.enemies[0].x).not.toBe(beforeX);
  });

  it("same seed and same inputs produce same state (determinism)", () => {
    const params = createGameParams({ seed: 42, wave: { baseIntervalFrames: 5 } });
    let gameA = createGame(params);
    let gameB = createGame(params);
    for (let frame = 1; frame <= 10; frame++) {
      gameA = tick(gameA, frame, frame === 3 ? { buyUpgrade: UpgradeType.Damage } : undefined);
      gameB = tick(gameB, frame, frame === 3 ? { buyUpgrade: UpgradeType.Damage } : undefined);
    }
    expect(gameA.player.life).toBe(gameB.player.life);
    expect(gameA.player.damage).toBe(gameB.player.damage);
    expect(gameA.money).toBe(gameB.money);
    expect(gameA.enemies.length).toBe(gameB.enemies.length);
  });

  it("buyUpgrade when enough money applies upgrade and deducts cost", () => {
    const params = createGameParams({
      economy: { upgradeCostBase: 10, upgradeCostIncrement: 0 },
    });
    let game = createGame(params);
    game = { ...game, money: 100 };
    const cost = 10;
    const damageBefore = game.player.damage;
    game = tick(game, 1, { buyUpgrade: UpgradeType.Damage });
    expect(game.money).toBe(100 - cost);
    expect(game.player.damage).toBeGreaterThan(damageBefore);
  });

  it("buyUpgrade when not enough money does nothing", () => {
    const params = createGameParams();
    let game = createGame(params);
    game = { ...game, money: 0 };
    const damageBefore = game.player.damage;
    game = tick(game, 0, { buyUpgrade: UpgradeType.Damage });
    expect(game.money).toBe(0);
    expect(game.player.damage).toBe(damageBefore);
  });

  it("thorns retaliates against stuck enemies", () => {
    const params = createGameParams({
      seed: 1,
      wave: { stuckEnemyAttackIntervalFrames: 1, baseIntervalFrames: 999999 },
      player: {
        initialRange: 1, // avoid player shooting at the test enemy
        initialArmorPercent: 0,
        initialArmorFixed: 0,
        initialThornsFixed: 3,
        initialThornsPercent: 50,
      },
      enemies: {
        base: { countPerWave: 0 },
        rapid: { countPerWave: 0 },
        boss: { countPerWave: 0 },
      },
    });

    let game = createGame(params);
    const enemy = createEnemy({
      id: 123,
      x: 200,
      y: 0,
      life: 30,
      speed: 0,
      damage: 10,
      size: 12,
      archetype: EnemyArchetype.Base,
    });
    enemy.stuck = true;
    enemy.lastDamageFrame = 0;
    game = { ...game, enemies: [enemy] };

    game = tick(game, 1);

    expect(game.player.life).toBe(90); // 100 - 10
    expect(game.enemies[0]?.life).toBe(22); // 30 - (3 + 10*0.5) = 22
  });

  it("vampirism heals when projectiles damage enemies", () => {
    const params = createGameParams({
      seed: 1,
      wave: { baseIntervalFrames: 999999, stuckEnemyAttackIntervalFrames: 999999 },
      player: {
        initialLife: 90,
        initialMaxLife: 100,
        initialRegen: 0,
        initialVampirismPercent: 50,
        initialRange: 300, // keep default behavior: enemy should be targetable
      },
      enemies: {
        base: { countPerWave: 0 },
        rapid: { countPerWave: 0 },
        boss: { countPerWave: 0 },
      },
    });

    let game = createGame(params);
    const enemy = createEnemy({
      id: 1,
      x: 50,
      y: 0,
      life: 20,
      maxLife: 20,
      speed: 0,
      damage: 0,
      size: 40, // larger collision radius so the projectile hits in the same tick
      archetype: EnemyArchetype.Base,
    });
    game = { ...game, enemies: [enemy] };

    game = tick(game, 1);

    expect(game.player.life).toBe(95); // heals 50% of dealt damage: 10 -> +5
  });

  it("tick when player life <= 0 sets state to GameOver", () => {
    const params = createGameParams({
      player: { initialLife: 0, initialMaxLife: 100, initialRegen: 0 },
    });
    let game = createGame(params);
    expect(game.player.life).toBe(0);
    game = tick(game, 1);
    expect(game.state).toBe(GameState.GameOver);
  });

  it("tick when state is GameOver returns same game", () => {
    const params = createGameParams({
      player: { initialLife: 0, initialRegen: 0 },
    });
    let game = createGame(params);
    game = tick(game, 1);
    expect(game.state).toBe(GameState.GameOver);
    const after = tick(game, 2);
    expect(after.state).toBe(GameState.GameOver);
    expect(after.frameIndex).toBe(1);
  });

  it("replay: same seed + same recorded inputs produce identical final state", () => {
    const params = createGameParams({ seed: 12345, wave: { baseIntervalFrames: 10 } });
    const recordedInputs: { frame: number; buyUpgrade?: UpgradeTypeValue }[] = [
      { frame: 5, buyUpgrade: UpgradeType.Damage },
      { frame: 12, buyUpgrade: UpgradeType.Life },
      { frame: 20, buyUpgrade: undefined },
    ];

    let gameLive = createGame(params);
    for (let frame = 1; frame <= 25; frame++) {
      const input = recordedInputs.find((r) => r.frame === frame);
      gameLive = tick(gameLive, frame, input?.buyUpgrade != null ? { buyUpgrade: input.buyUpgrade } : undefined);
    }

    let gameReplay = createGame(params);
    for (let frame = 1; frame <= 25; frame++) {
      const input = recordedInputs.find((r) => r.frame === frame);
      gameReplay = tick(gameReplay, frame, input?.buyUpgrade != null ? { buyUpgrade: input.buyUpgrade } : undefined);
    }

    expect(gameReplay.state).toBe(gameLive.state);
    expect(gameReplay.player.life).toBe(gameLive.player.life);
    expect(gameReplay.player.damage).toBe(gameLive.player.damage);
    expect(gameReplay.money).toBe(gameLive.money);
    expect(gameReplay.enemiesKilled).toBe(gameLive.enemiesKilled);
    expect(gameReplay.enemies.length).toBe(gameLive.enemies.length);
    expect(gameReplay.projectiles.length).toBe(gameLive.projectiles.length);
    expect(gameReplay.coinsEarned).toBe(gameLive.coinsEarned);
  });
});
