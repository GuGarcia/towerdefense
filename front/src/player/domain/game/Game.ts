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
import { EnemyArchetype } from "../enemy/EnemyArchetype";
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

function pseudoRandom01(seed: number, frameIndex: number): number {
  // Deterministic 0..1 generator for gameplay effects (crit, etc.).
  let x = (seed ^ Math.imul(frameIndex, 0x9e3779b9)) >>> 0;
  x = Math.imul(x ^ (x >>> 15), x | 1);
  x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
  return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
}

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
  /** Coins earned so far during this run (meta-progression). */
  coinsEarned: number;
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
    armorPercent: p.initialArmorPercent ?? 0,
    armorFixed: p.initialArmorFixed ?? 0,
    thornsFixed: p.initialThornsFixed ?? 0,
    thornsPercent: p.initialThornsPercent ?? 0,
    critChance: p.initialCritChance ?? 0,
    critDamagePercent: p.initialCritDamagePercent ?? 150,
    vampirismPercent: p.initialVampirismPercent ?? 0,
    cashBonusPercent: p.initialCashBonusPercent ?? 0,
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
    coinsEarned: 0,
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

function applyWaveCoins(game: Game, frameIndex: number): number {
  const waveNumber = getWaveNumberAtFrame(frameIndex, game.params);
  const prevWaveNumber = frameIndex > 0 ? getWaveNumberAtFrame(frameIndex - 1, game.params) : 0;
  if (waveNumber < 1 || waveNumber <= prevWaveNumber) return 0;
  const base = game.params.economy.coinPerWaveBase;
  const percent = game.params.economy.coinPerWavePercent;
  return base * (percent / 100);
}

function updateEnemiesAndStuck(game: Game, frameIndex: number): Enemy[] {
  const toSpawn = getEnemiesToSpawnThisFrame(frameIndex, game.params);
  let enemies = [...game.enemies, ...toSpawn].map(moveTowardCenter);
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
): { player: Player; enemies: Enemy[]; projectiles: Projectile[]; earned: number; earnedCoins: number; killedThisFrame: number } {
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
    const baseDamage = nextPlayer.damage;
    let shotDamage = baseDamage;
    if (nextPlayer.critChance > 0) {
      const roll = pseudoRandom01(params.seed, _frameIndex);
      if (roll < nextPlayer.critChance / 100) {
        shotDamage = baseDamage * (nextPlayer.critDamagePercent / 100);
      }
    }
    nextProjectiles = [
      ...nextProjectiles,
      createProjectile({
        x: 0,
        y: 0,
        dx: -dx,
        dy: -dy,
        damage: shotDamage,
        targetEnemyId: nearest.id,
      }),
    ];
    nextEnemies = nextEnemies.map((e) =>
      e.id === nearest!.id ? { ...e, incomingDamage: (e.incomingDamage ?? 0) + shotDamage } : e
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
  let vampHeal = 0;
  nextEnemies = nextEnemies.map((e) => {
    const dmg = enemyDamage[e.id];
    if (dmg == null) return e;
    const beforeLife = e.life;
    const after = enemyTakeDamage(e, dmg);
    const dealt = Math.max(0, beforeLife - after.life);
    if (dealt > 0 && nextPlayer.vampirismPercent > 0) {
      vampHeal += dealt * (nextPlayer.vampirismPercent / 100);
    }
    return after;
  });
  if (vampHeal > 0) {
    nextPlayer = { ...nextPlayer, life: Math.min(nextPlayer.maxLife, nextPlayer.life + vampHeal) };
  }

  const currency = params.economy.currencyPerKill;
  const cashMultiplier = 1 + nextPlayer.cashBonusPercent / 100;
  const coinPerBoss = params.economy.coinPerBossBase;
  let earned = 0;
  let killedThisFrame = 0;
  let earnedCoins = 0;
  for (const e of nextEnemies) {
    if (isDead(e)) {
      earned += (currency[e.archetype as keyof typeof currency] ?? currency.base) * cashMultiplier;
      killedThisFrame += 1;
      if (e.archetype === EnemyArchetype.Boss) earnedCoins += coinPerBoss;
    }
  }
  return {
    player: nextPlayer,
    enemies: nextEnemies,
    projectiles: remainingProjectiles,
    earned,
    killedThisFrame,
    earnedCoins,
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
      // Thorns: retaliation applied to the enemy that just damaged the player.
      const thornsFixed = player.thornsFixed ?? 0;
      const thornsPercent = player.thornsPercent ?? 0;
      const retaliatory = thornsFixed + e.damage * (thornsPercent / 100);
      return enemyTakeDamage({ ...e, lastDamageFrame: frameIndex }, retaliatory);
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
  next = {
    ...next,
    money: next.money + applyWaveEconomy(game, frameIndex) * (1 + game.player.cashBonusPercent / 100),
    coinsEarned: next.coinsEarned + applyWaveCoins(game, frameIndex),
  };

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
    coinsEarned: next.coinsEarned + shot.earnedCoins,
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
