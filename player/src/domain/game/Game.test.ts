import { describe, it, expect } from "bun:test";
import { createGame, tick } from "./Game";
import { createGameParams } from "./GameParams";
import { GameState } from "./GameState";
import { UpgradeType } from "../player/UpgradeType";

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
    game = tick(game, 1, { buyUpgrade: UpgradeType.Damage });
    expect(game.money).toBe(0);
    expect(game.player.damage).toBe(damageBefore);
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
});
