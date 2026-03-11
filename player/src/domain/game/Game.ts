/**
 * Root aggregate: global game state.
 */
import type { GameParams } from "./GameParams";
import type { GameStateValue } from "./GameState";
import type { Player } from "../player/Player";
import type { Enemy } from "../enemy/Enemy";
import type { Projectile } from "../projectile/Projectile";
import type { UpgradeTypeValue } from "../player/UpgradeType";
import { GameState } from "./GameState";
import {
  createPlayer,
  takeDamage as playerTakeDamage,
  applyRegen,
  canShoot,
  consumeShotCooldown,
  advanceShotCooldown,
  applyUpgrade,
  getUpgradeLevel,
} from "../player/Player";
import { getUpgradeCost } from "../economy/UpgradeCost";
import {
  moveTowardCenter,
  takeDamage as enemyTakeDamage,
  isDead,
  distanceToCenter,
  directionTowardCenter,
} from "../enemy/Enemy";
import { createProjectile, updatePosition } from "../projectile/Projectile";
import { getEnemiesToSpawnThisFrame } from "../wave/WaveSpawner";

const PLAYER_HITBOX_RADIUS = 40;

export interface GameInput {
  buyUpgrade?: UpgradeTypeValue;
}

export interface Game {
  params: GameParams;
  state: GameStateValue;
  player: Player;
  enemies: Enemy[];
  projectiles: Projectile[];
  money: number;
  frameIndex: number;
}

export function createGame(gameParams: GameParams): Game {
  const p = gameParams.player;
  const player = createPlayer({
    life: p.initialLife,
    maxLife: p.initialMaxLife,
    damage: p.initialDamage,
    regen: p.initialRegen,
    attackSpeed: p.initialAttackSpeed,
  });
  return {
    params: gameParams,
    state: GameState.Playing,
    player,
    enemies: [],
    projectiles: [],
    money: 0,
    frameIndex: 0,
  };
}

export function tick(game: Game, frameIndex: number, input?: GameInput | null): Game {
  if (game.state === GameState.GameOver) return game;

  const next: Game = { ...game, frameIndex };

  if (input?.buyUpgrade) {
    const cost = getUpgradeCost(input.buyUpgrade, getUpgradeLevel(game.player, input.buyUpgrade), game.params);
    if (game.money >= cost) {
      next.money = game.money - cost;
      next.player = applyUpgrade(game.player, input.buyUpgrade, game.params);
    }
  }

  const toSpawn = getEnemiesToSpawnThisFrame(frameIndex, game.params);
  next.enemies = [...game.enemies, ...toSpawn];
  next.enemies = next.enemies.map(moveTowardCenter);
  next.player = applyRegen(next.player, game.params);

  const alive = next.enemies.filter((e) => !isDead(e));
  const nearest = alive.length ? alive.reduce((a, b) => (distanceToCenter(a) < distanceToCenter(b) ? a : b)) : null;

  if (nearest && canShoot(next.player)) {
    const { dx, dy } = directionTowardCenter(nearest.x, nearest.y);
    next.projectiles = [
      ...next.projectiles,
      createProjectile({ x: 0, y: 0, dx: -dx, dy: -dy, damage: next.player.damage }),
    ];
    next.player = consumeShotCooldown(next.player);
  } else {
    next.player = advanceShotCooldown(next.player);
  }

  next.projectiles = next.projectiles.map(updatePosition);

  const enemyDamage: Record<number, number> = {};
  const remainingProjectiles: Projectile[] = [];
  for (const proj of next.projectiles) {
    let hit = false;
    for (const enemy of next.enemies) {
      if (isDead(enemy)) continue;
      const d = Math.sqrt((proj.x - enemy.x) ** 2 + (proj.y - enemy.y) ** 2);
      if (d <= enemy.size + 8) {
        enemyDamage[enemy.id] = (enemyDamage[enemy.id] ?? 0) + proj.damage;
        hit = true;
        break;
      }
    }
    if (!hit) remainingProjectiles.push(proj);
  }
  next.projectiles = remainingProjectiles;
  next.enemies = next.enemies.map((e) => {
    const dmg = enemyDamage[e.id];
    if (dmg == null) return e;
    return enemyTakeDamage(e, dmg);
  });

  const currencyPerKill = game.params.economy.currencyPerKill;
  let earned = 0;
  for (const e of next.enemies) {
    if (isDead(e)) earned += currencyPerKill[e.archetype as keyof typeof currencyPerKill] ?? currencyPerKill.base;
  }
  next.money = next.money + earned;

  let playerDamage = 0;
  for (const e of next.enemies) {
    if (isDead(e)) continue;
    if (distanceToCenter(e) < PLAYER_HITBOX_RADIUS) playerDamage += e.damage;
  }
  if (playerDamage > 0) {
    next.player = playerTakeDamage(next.player, playerDamage);
    next.enemies = next.enemies.filter((e) => distanceToCenter(e) >= PLAYER_HITBOX_RADIUS || isDead(e));
  }

  next.enemies = next.enemies.filter((e) => !isDead(e));
  next.enemies = next.enemies.map((e) => ({
    ...e,
    hitFlashFrames: Math.max(0, (e.hitFlashFrames ?? 0) - 1),
  }));
  if (next.player.life <= 0) next.state = GameState.GameOver;

  return next;
}
