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
};

const META_KEY = "towerdefense_meta";
const META_VERSION = 1;

export const UPGRADE_COST_BASE = 10;
export const UPGRADE_COST_FACTOR = 1.1;

export const LIFE_DELTA_PER_LEVEL = 5;
export const DAMAGE_DELTA_PER_LEVEL = 1;

const DEFAULT_META: StoredMeta = {
  version: META_VERSION,
  coins: 0,
  coinPerWaveBase: 1,
  coinPerWavePercent: 100,
  coinPerBossBase: 1,
  lifeLevel: 0,
  damageLevel: 0,
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

export function getNextLifeUpgradeCost(meta: StoredMeta = getStoredMeta()): number {
  return costForNextLevel(meta.lifeLevel);
}

export function getNextDamageUpgradeCost(meta: StoredMeta = getStoredMeta()): number {
  return costForNextLevel(meta.damageLevel);
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

