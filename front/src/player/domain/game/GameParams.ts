/**
 * Game parameters (immutable value object).
 * @see docs/GAME_PARAMS.md
 */
export interface GameParams {
  readonly seed: number;
  readonly durationFrames: number;
  readonly player: {
    readonly initialLife: number;
    readonly initialMaxLife: number;
    readonly initialDamage: number;
    /** Initial armor percent: damage reduction applied before fixed armor. */
    readonly initialArmorPercent?: number;
    /** Initial fixed armor: applied after armor percent. */
    readonly initialArmorFixed?: number;
    /** Step (in percentage points) added to armorPercent per armorPercent upgrade level. */
    readonly armorPercentStep?: number;
    readonly initialRegen: number;
    readonly initialAttackSpeed: number;
    /** Shooting range (distance from center); default 300 if omitted. */
    readonly initialRange?: number;
    /** Upgrade delta factors (per level): damage +15% = 0.15, life +10% = 0.1, etc. */
    readonly upgradeFactorDamage?: number;
    readonly upgradeFactorLife?: number;
    readonly upgradeFactorRegen?: number;
    readonly upgradeFactorAttackSpeed?: number;
    readonly upgradeFactorRange?: number;
  };
  readonly economy: {
    /** Cost for first upgrade (level 0 → 1). */
    readonly upgradeCostBase: number;
    /** Extra cost per level: cost(level) = base + level * increment (arithmetic). */
    readonly upgradeCostIncrement: number;
    readonly currencyPerKill: { readonly base: number; readonly rapid: number; readonly boss: number };
    /** Bonus or at start of each wave: base + (waveNumber - 1) * increment (e.g. 5, 10, 15…). */
    readonly waveBonusBase: number;
    readonly waveBonusIncrement: number;
    /** Coin economy (meta progression): base coin amount per wave reached. */
    readonly coinPerWaveBase: number;
    /** Coin economy multiplier: 100 => x1, 101 => x1.01, etc. */
    readonly coinPerWavePercent: number;
    /** Coin economy: coins per boss killed. */
    readonly coinPerBossBase: number;
  };
  readonly wave: {
    readonly spawnRadius: number;
    readonly baseIntervalFrames: number;
    /** Spread wave spawn over this many frames (0 = all at wave start). */
    readonly spreadSpawnOverFrames: number;
    readonly bossEveryNWaves: number;
    /** Frames between each damage tick from a stuck enemy (e.g. 60 = 1 hit per second). */
    readonly stuckEnemyAttackIntervalFrames: number;
    /** Multiply wave 1 stats by this factor to make the start very easy (e.g. 0.5 = half difficulty). */
    readonly wave1DifficultyFactor?: number;
    /** Global difficulty multiplier (50 = easy, 100 = normal, 150 = hard). */
    readonly difficultyPercent?: number;
    readonly difficultyScaling: {
      readonly life: number;
      readonly speed: number;
      readonly damage: number;
      readonly count: number;
    };
  };
  readonly enemies: {
    readonly base: EnemyConfig;
    readonly rapid: EnemyConfig;
    readonly boss: EnemyConfig;
  };
}

export interface EnemyConfig {
  readonly life: number;
  readonly speed: number;
  readonly damage: number;
  readonly size: number;
  readonly countPerWave: number;
}

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

export function createGameParams(overrides: DeepPartial<GameParams> = {}): GameParams {
  const params: GameParams = {
    seed: 0,
    durationFrames: 60 * 60 * 24 * 365,
    player: {
      initialLife: 100,
      initialMaxLife: 100,
      initialDamage: 10,
      initialArmorPercent: 0,
      initialArmorFixed: 0,
      armorPercentStep: 5,
      initialRegen: 0.1,
      initialAttackSpeed: 2,
      initialRange: 300,
      upgradeFactorDamage: 0.15,
      upgradeFactorLife: 0.1,
      upgradeFactorRegen: 0.5,
      upgradeFactorAttackSpeed: 0.15,
      upgradeFactorRange: 0.15,
    },
    economy: {
      upgradeCostBase: 10,
      upgradeCostIncrement: 5,
      currencyPerKill: { base: 10, rapid: 5, boss: 100 },
      waveBonusBase: 5,
      waveBonusIncrement: 5,
      coinPerWaveBase: 1,
      coinPerWavePercent: 100,
      coinPerBossBase: 1,
    },
    wave: {
      spawnRadius: 600,
      baseIntervalFrames: 60 * 5,
      spreadSpawnOverFrames: 300,
      bossEveryNWaves: 10,
      stuckEnemyAttackIntervalFrames: 60,
      wave1DifficultyFactor: 0.6,
      difficultyPercent: 100,
      difficultyScaling: { life: 1.1, speed: 1.02, damage: 1.05, count: 1.1 },
    },
    enemies: {
      base: { life: 20, speed: 2, damage: 5, size: 12, countPerWave: 5 },
      rapid: { life: 8, speed: 4, damage: 2, size: 6, countPerWave: 8 },
      boss: { life: 50, speed: 0.8, damage: 25, size: 32, countPerWave: 1 },
    },
  };

  const merged = mergeDeep(params as unknown as Record<string, unknown>, overrides as unknown as Record<string, unknown>);
  return deepFreeze(merged as unknown as GameParams);
}

function mergeDeep(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const out = { ...target };
  for (const key of Object.keys(source)) {
    const val = source[key];
    if (val != null && typeof val === "object" && !Array.isArray(val)) {
      const targetVal = (out[key] ?? {}) as Record<string, unknown>;
      out[key] = mergeDeep(targetVal, val as Record<string, unknown>);
    } else {
      out[key] = val;
    }
  }
  return out;
}

function deepFreeze<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") return obj;
  Object.freeze(obj);
  for (const value of Object.values(obj)) {
    if (typeof value === "object" && value !== null) deepFreeze(value);
  }
  return obj;
}
