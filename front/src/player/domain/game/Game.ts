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
  clampToCircleRadius,
} from "../enemy/Enemy";
import { createProjectile, updatePosition } from "../projectile/Projectile";
import { getEnemiesToSpawnThisFrame, getWaveNumberAtFrame } from "../wave/WaveSpawner";

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
  /** Total enemies killed this run (for game over stats). */
  enemiesKilled: number;
}

export function createGame(gameParams: GameParams): Game {
  const p = gameParams.player;
  const player = createPlayer({
    life: p.initialLife,
    maxLife: p.initialMaxLife,
    damage: p.initialDamage,
    regen: p.initialRegen,
    attackSpeed: p.initialAttackSpeed,
    range: p.initialRange ?? 300,
  });
  return {
    params: gameParams,
    state: GameState.Playing,
    player,
    enemies: [],
    projectiles: [],
    money: 0,
    frameIndex: 0,
    enemiesKilled: 0,
  };
}

function applyWaveEconomy(game: Game, frameIndex: number): number {
  const waveNumber = getWaveNumberAtFrame(frameIndex, game.params);
  const prevWaveNumber = frameIndex > 0 ? getWaveNumberAtFrame(frameIndex - 1, game.params) : 0;
  if (waveNumber < 1 || waveNumber <= prevWaveNumber) return 0;
  const base = game.params.economy.waveBonusBase ?? 5;
  const inc = game.params.economy.waveBonusIncrement ?? 5;
  return base + (waveNumber - 1) * inc;
}

function updateEnemiesAndStuck(game: Game, frameIndex: number): Enemy[] {
  const toSpawn = getEnemiesToSpawnThisFrame(frameIndex, game.params);
  let enemies = [...game.enemies, ...toSpawn].map(moveTowardCenter);
  const interval = game.params.wave.stuckEnemyAttackIntervalFrames ?? 60;
  enemies = enemies.map((e) => {
    const incomingDamage = e.incomingDamage ?? 0;
    if (e.stuck) return e;
    if (distanceToCenter(e) <= PLAYER_HITBOX_RADIUS) {
      const { x, y } = clampToCircleRadius(e.x, e.y, PLAYER_HITBOX_RADIUS);
      return { ...e, stuck: true, lastDamageFrame: frameIndex, x, y, incomingDamage };
    }
    return { ...e, incomingDamage };
  });
  return enemies;
}

function handleShootingAndProjectiles(
  player: Player,
  enemies: Enemy[],
  projectiles: Projectile[],
  _frameIndex: number,
  params: GameParams
): { player: Player; enemies: Enemy[]; projectiles: Projectile[]; earned: number; killedThisFrame: number } {
  let nextPlayer = player;
  const alive = enemies.filter((e) => !isDead(e));
  const effectiveAlive = alive.filter((e) => {
    const incoming = e.incomingDamage ?? 0;
    return e.life - incoming > 0;
  });
  const inRange = effectiveAlive.filter((e) => distanceToCenter(e) <= nextPlayer.range);
  const nearest = inRange.length
    ? inRange.reduce((a, b) => (distanceToCenter(a) < distanceToCenter(b) ? a : b))
    : null;

  let nextProjectiles = [...projectiles];
  let nextEnemies = [...enemies];

  if (nearest && canShoot(nextPlayer)) {
    const { dx, dy } = directionTowardCenter(nearest.x, nearest.y);
    nextProjectiles = [
      ...nextProjectiles,
      createProjectile({
        x: 0,
        y: 0,
        dx: -dx,
        dy: -dy,
        damage: nextPlayer.damage,
        targetEnemyId: nearest.id,
      }),
    ];
    nextEnemies = nextEnemies.map((e) =>
      e.id === nearest!.id ? { ...e, incomingDamage: (e.incomingDamage ?? 0) + nextPlayer.damage } : e
    );
    nextPlayer = consumeShotCooldown(nextPlayer);
  } else {
    nextPlayer = advanceShotCooldown(nextPlayer);
  }

  nextProjectiles = nextProjectiles.map(updatePosition);

  const enemyDamage: Record<number, number> = {};
  const remainingProjectiles: Projectile[] = [];
  for (const proj of nextProjectiles) {
    let hitEnemy: Enemy | null = null;
    for (const enemy of nextEnemies) {
      if (isDead(enemy)) continue;
      const d = Math.sqrt((proj.x - enemy.x) ** 2 + (proj.y - enemy.y) ** 2);
      if (d <= enemy.size + 8) {
        hitEnemy = enemy;
        break;
      }
    }
    if (hitEnemy) {
      enemyDamage[hitEnemy.id] = (enemyDamage[hitEnemy.id] ?? 0) + proj.damage;
      nextEnemies = nextEnemies.map((e) =>
        e.id === proj.targetEnemyId
          ? { ...e, incomingDamage: Math.max(0, (e.incomingDamage ?? 0) - proj.damage) }
          : e
      );
    } else {
      remainingProjectiles.push(proj);
    }
  }
  nextEnemies = nextEnemies.map((e) => {
    const dmg = enemyDamage[e.id];
    if (dmg == null) return e;
    return enemyTakeDamage(e, dmg);
  });

  const currency = params.economy.currencyPerKill;
  let earned = 0;
  let killedThisFrame = 0;
  for (const e of nextEnemies) {
    if (isDead(e)) {
      earned += currency[e.archetype as keyof typeof currency] ?? currency.base;
      killedThisFrame += 1;
    }
  }
  return {
    player: nextPlayer,
    enemies: nextEnemies,
    projectiles: remainingProjectiles,
    earned,
    killedThisFrame,
  };
}

function applyStuckDamageAndCleanup(
  game: Game,
  player: Player,
  enemies: Enemy[],
  frameIndex: number
): { player: Player; enemies: Enemy[]; state: GameStateValue } {
  const interval = game.params.wave.stuckEnemyAttackIntervalFrames ?? 60;
  let playerDamage = 0;
  const afterStuck = enemies.map((e) => {
    if (!e.stuck || isDead(e)) return e;
    const last = e.lastDamageFrame ?? frameIndex;
    if (frameIndex - last >= interval) {
      playerDamage += e.damage;
      return { ...e, lastDamageFrame: frameIndex };
    }
    return e;
  });
  const nextPlayer = playerDamage > 0 ? playerTakeDamage(player, playerDamage) : player;
  const alive = afterStuck.filter((e) => !isDead(e));
  const nextEnemies = alive.map((e) => ({
    ...e,
    hitFlashFrames: Math.max(0, (e.hitFlashFrames ?? 0) - 1),
  }));
  const state = nextPlayer.life <= 0 ? GameState.GameOver : game.state;
  return { player: nextPlayer, enemies: nextEnemies, state };
}

export function tick(game: Game, frameIndex: number, input?: GameInput | null): Game {
  if (game.state === GameState.GameOver) return game;

  let next: Game = { ...game, frameIndex };
  next = { ...next, money: next.money + applyWaveEconomy(game, frameIndex) };

  if (input?.buyUpgrade) {
    const cost = getUpgradeCost(input.buyUpgrade, getUpgradeLevel(game.player, input.buyUpgrade), game.params);
    if (game.money >= cost) {
      next = { ...next, money: game.money - cost, player: applyUpgrade(game.player, input.buyUpgrade, game.params) };
    }
  }

  next = { ...next, enemies: updateEnemiesAndStuck(next, frameIndex) };
  next = { ...next, player: applyRegen(next.player, game.params) };

  const shot = handleShootingAndProjectiles(next.player, next.enemies, next.projectiles, frameIndex, game.params);
  next = {
    ...next,
    player: shot.player,
    projectiles: shot.projectiles,
    enemies: shot.enemies,
    money: next.money + shot.earned,
    enemiesKilled: game.enemiesKilled + shot.killedThisFrame,
  };

  const stuck = applyStuckDamageAndCleanup(game, next.player, next.enemies, frameIndex);
  next = {
    ...next,
    player: stuck.player,
    enemies: stuck.enemies,
    state: stuck.state,
  };

  return next;
}
