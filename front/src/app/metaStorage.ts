/**
 * Meta-progression (localStorage only).
 * Keys:
 * - coins: total coins owned
 * - coin economy params used to compute coins earned per run
 */
export type StoredMeta = {
  version: number;
  coins: number;
  coinPerWaveBase: number; // coin/wave base
  coinPerWavePercent: number; // percent multiplier on coin/wave base (100 => x1)
  coinPerBossBase: number; // coin/boss base
  lifeLevel: number; // meta upgrade level: +initialLife/maxLife
  damageLevel: number; // meta upgrade level: +initialDamage
  difficultyLevel: number; // meta difficulty level (0 => 100%)
};

const META_KEY = "towerdefense_meta";
const META_VERSION = 1;

export const UPGRADE_COST_BASE = 10;
export const UPGRADE_COST_FACTOR = 1.1;

export const LIFE_DELTA_PER_LEVEL = 5;
export const DAMAGE_DELTA_PER_LEVEL = 1;
export const COIN_WAVE_BASE_DELTA_PER_LEVEL = 1;
export const COIN_WAVE_PERCENT_DELTA_PER_LEVEL = 1; // +1%
export const COIN_BOSS_BASE_DELTA_PER_LEVEL = 1;
export const DIFFICULTY_PERCENT_BASE = 100;
export const DIFFICULTY_PERCENT_DELTA_PER_LEVEL = 10;

const DEFAULT_META: StoredMeta = {
  version: META_VERSION,
  coins: 0,
  coinPerWaveBase: 1,
  coinPerWavePercent: 100,
  coinPerBossBase: 1,
  lifeLevel: 0,
  damageLevel: 0,
  difficultyLevel: 0,
};

export function getStoredMeta(): StoredMeta {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return { ...DEFAULT_META };
    const parsed = JSON.parse(raw) as Partial<StoredMeta>;
    return {
      ...DEFAULT_META,
      ...parsed,
      version: META_VERSION,
    };
  } catch {
    return { ...DEFAULT_META };
  }
}

export function setStoredMeta(meta: StoredMeta): void {
  localStorage.setItem(META_KEY, JSON.stringify(meta));
}

export function addCoins(delta: number): number {
  const meta = getStoredMeta();
  const nextCoins = Math.max(0, meta.coins + delta);
  const next = { ...meta, coins: nextCoins };
  setStoredMeta(next);
  return nextCoins;
}

function costForNextLevel(currentLevel: number): number {
  // cost(level 0->1) = base * factor^0, then base * factor^1, etc.
  return Math.floor(UPGRADE_COST_BASE * Math.pow(UPGRADE_COST_FACTOR, currentLevel));
}

function coinWaveBaseLevel(meta: StoredMeta): number {
  return Math.max(0, meta.coinPerWaveBase - 1);
}

function coinWavePercentLevel(meta: StoredMeta): number {
  return Math.max(0, meta.coinPerWavePercent - 100);
}

function coinBossBaseLevel(meta: StoredMeta): number {
  return Math.max(0, meta.coinPerBossBase - 1);
}

export function getDifficultyPercent(meta: StoredMeta = getStoredMeta()): number {
  return DIFFICULTY_PERCENT_BASE + meta.difficultyLevel * DIFFICULTY_PERCENT_DELTA_PER_LEVEL;
}

export function getNextLifeUpgradeCost(meta: StoredMeta = getStoredMeta()): number {
  return costForNextLevel(meta.lifeLevel);
}

export function getNextDamageUpgradeCost(meta: StoredMeta = getStoredMeta()): number {
  return costForNextLevel(meta.damageLevel);
}

export function getNextCoinWaveBaseUpgradeCost(meta: StoredMeta = getStoredMeta()): number {
  return costForNextLevel(coinWaveBaseLevel(meta));
}

export function getNextCoinWavePercentUpgradeCost(meta: StoredMeta = getStoredMeta()): number {
  return costForNextLevel(coinWavePercentLevel(meta));
}

export function getNextCoinBossBaseUpgradeCost(meta: StoredMeta = getStoredMeta()): number {
  return costForNextLevel(coinBossBaseLevel(meta));
}

export function getNextDifficultyUpgradeCost(meta: StoredMeta = getStoredMeta()): number {
  return costForNextLevel(meta.difficultyLevel);
}

export function buyLifeUpgrade(): { ok: boolean; coins: number; nextLevel: number } {
  const meta = getStoredMeta();
  const cost = costForNextLevel(meta.lifeLevel);
  if (meta.coins < cost) return { ok: false, coins: meta.coins, nextLevel: meta.lifeLevel };
  const next = { ...meta, coins: meta.coins - cost, lifeLevel: meta.lifeLevel + 1 };
  setStoredMeta(next);
  return { ok: true, coins: next.coins, nextLevel: next.lifeLevel };
}

export function buyDamageUpgrade(): { ok: boolean; coins: number; nextLevel: number } {
  const meta = getStoredMeta();
  const cost = costForNextLevel(meta.damageLevel);
  if (meta.coins < cost) return { ok: false, coins: meta.coins, nextLevel: meta.damageLevel };
  const next = { ...meta, coins: meta.coins - cost, damageLevel: meta.damageLevel + 1 };
  setStoredMeta(next);
  return { ok: true, coins: next.coins, nextLevel: next.damageLevel };
}

export function buyCoinWaveBaseUpgrade(): { ok: boolean; coins: number; nextBase: number } {
  const meta = getStoredMeta();
  const nextLevel = coinWaveBaseLevel(meta);
  const cost = costForNextLevel(nextLevel);
  if (meta.coins < cost) return { ok: false, coins: meta.coins, nextBase: meta.coinPerWaveBase };
  const next = {
    ...meta,
    coins: meta.coins - cost,
    coinPerWaveBase: meta.coinPerWaveBase + COIN_WAVE_BASE_DELTA_PER_LEVEL,
  };
  setStoredMeta(next);
  return { ok: true, coins: next.coins, nextBase: next.coinPerWaveBase };
}

export function buyCoinWavePercentUpgrade(): { ok: boolean; coins: number; nextPercent: number } {
  const meta = getStoredMeta();
  const nextLevel = coinWavePercentLevel(meta);
  const cost = costForNextLevel(nextLevel);
  if (meta.coins < cost) return { ok: false, coins: meta.coins, nextPercent: meta.coinPerWavePercent };
  const next = {
    ...meta,
    coins: meta.coins - cost,
    coinPerWavePercent: meta.coinPerWavePercent + COIN_WAVE_PERCENT_DELTA_PER_LEVEL,
  };
  setStoredMeta(next);
  return { ok: true, coins: next.coins, nextPercent: next.coinPerWavePercent };
}

export function buyCoinBossBaseUpgrade(): { ok: boolean; coins: number; nextBase: number } {
  const meta = getStoredMeta();
  const nextLevel = coinBossBaseLevel(meta);
  const cost = costForNextLevel(nextLevel);
  if (meta.coins < cost) return { ok: false, coins: meta.coins, nextBase: meta.coinPerBossBase };
  const next = {
    ...meta,
    coins: meta.coins - cost,
    coinPerBossBase: meta.coinPerBossBase + COIN_BOSS_BASE_DELTA_PER_LEVEL,
  };
  setStoredMeta(next);
  return { ok: true, coins: next.coins, nextBase: next.coinPerBossBase };
}

export function buyDifficultyUpgrade(): { ok: boolean; coins: number; nextLevel: number } {
  const meta = getStoredMeta();
  const cost = costForNextLevel(meta.difficultyLevel);
  if (meta.coins < cost) return { ok: false, coins: meta.coins, nextLevel: meta.difficultyLevel };
  const next = {
    ...meta,
    coins: meta.coins - cost,
    difficultyLevel: meta.difficultyLevel + 1,
  };
  setStoredMeta(next);
  return { ok: true, coins: next.coins, nextLevel: next.difficultyLevel };
}

