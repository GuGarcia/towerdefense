/**
 * Headless simulation with 3 player profiles and optional param overrides.
 * Run max: 10 min (36000 frames). Goal: courbe normale avec sommet à ~8 min (28800 frames)
 * — la plupart des parties se terminent (mort) autour de 8 min, certaines avant, certaines jusqu’à 10 min.
 *
 * Usage: bun run src/simulate.ts [runs] [outputDir] [paramsFile]
 *   runs       number of games per profile (default 100)
 *   outputDir  directory for best-replay-{profile}.json (default .)
 *   paramsFile JSON with partial GameParams (default: gameparams.json). C’est ce fichier qu’on édite après analyse des rapports.
 *
 * Profiles:
 *   full — upgrades all 5 stats (random choice when buying)
 *   two  — upgrades at most 2 stats (2 chosen at random at run start)
 *   one  — upgrades only 1 stat  (1 chosen at random at run start)
 *
 * make simulate RUNS=50
 * make simulate RUNS=100 SIMOUT=./out PARAMS=params.json
 */
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { createGame, tick } from "./domain/game/Game";
import { createGameParams } from "./domain/game/GameParams";
import type { GameParams } from "./domain/game/GameParams";
import { GameState } from "./domain/game/GameState";
import { getUpgradeLevel } from "./domain/player/Player";
import { getUpgradeCost } from "./domain/economy/UpgradeCost";
import { getWaveNumberAtFrame } from "./domain/wave/WaveSpawner";
import type { GameRecording, RecordedInput } from "./infrastructure/replay/GameRecording";

const UPGRADE_TYPES = [
  "damage",
  "life",
  "regen",
  "attackSpeed",
  "range",
  "armorPercent",
  "armorFixed",
  "thorns",
  "critChance",
  "critDamage",
  "vampirism",
  "cashBonusPercent",
] as const;
type UpgradeType = (typeof UPGRADE_TYPES)[number];

export type ProfileKind = "full" | "two" | "one";

const DEFAULT_RUNS = 100;
const DEFAULT_OUTPUT_DIR = ".";
const RAPPORT_DIR = "rapport";
const TARGET_FRAMES_10MIN = 60 * 60 * 10; // 36000 — durée max d’une run
const PEAK_TARGET_FRAMES = 60 * 60 * 8; // 28800 — objectif équilibrage: moyenne ~8 min (sommet de la courbe)
const MAX_SIMULATION_FRAMES = 40000; // arrêt si une simulation dépasse ce nombre de frames

export interface ProfileStats {
  runs: number;
  meanFrames: number;
  stdFrames: number;
  minFrames: number;
  maxFrames: number;
  p10Frames: number;
  p50Frames: number;
  p90Frames: number;
  meanWave: number;
  minWave: number;
  maxWave: number;
  bestFrames: number;
  bestWave: number;
  pctOfTarget: number;
  /** % de la moyenne par rapport au sommet visé (8 min) — viser ~100 % */
  pctOfPeak: number;
}

export interface SimulationRapport {
  timestamp: string;
  paramsFile?: string;
  params: Partial<GameParams>;
  runsPerProfile: number;
  targetFrames10Min: number;
  /** Objectif équilibrage: moyenne des runs proche de ce nombre (8 min) */
  targetPeakFrames: number;
  stats: Record<ProfileKind, ProfileStats>;
}
const UPGRADE_CHANCE = 0.06;

function randomSeed(): number {
  return Math.floor(Math.random() * 0x7fffffff);
}

function pickFrom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickSubset<T>(arr: readonly T[], k: number): T[] {
  const copy = [...arr];
  for (let i = 0; i < k; i++) {
    const j = i + Math.floor(Math.random() * (copy.length - i));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, k);
}

function runOneSimulation(
  seed: number,
  paramOverrides: Partial<GameParams>,
  profile: ProfileKind
): { recording: GameRecording; framesSurvived: number; waveReached: number } {
  const params = createGameParams({ ...paramOverrides, seed });
  let game = createGame(params);
  const inputs: RecordedInput[] = [];

  const allowedUpgrades: UpgradeType[] =
    profile === "full"
      ? [...UPGRADE_TYPES]
      : profile === "two"
        ? pickSubset(UPGRADE_TYPES, 2)
        : [pickFrom(UPGRADE_TYPES)];

  // Boucle jusqu’à Game Over ou limite de temps (durationFrames). Si le joueur ne meurt jamais,
  // on s’arrête à durationFrames et framesSurvived = durationFrames (ex. 36000) — pas un bug.
  const maxFrame = Math.min(params.durationFrames, MAX_SIMULATION_FRAMES);
  for (let frame = 0; frame <= maxFrame; frame++) {
    if (game.state === GameState.GameOver) break;

    let input: { buyUpgrade: UpgradeType } | null = null;
    if (Math.random() < UPGRADE_CHANCE) {
      const upgrade = pickFrom(allowedUpgrades);
      const level = getUpgradeLevel(game.player, upgrade);
      const cost = getUpgradeCost(upgrade, level, params);
      if (game.money >= cost) {
        input = { buyUpgrade: upgrade };
        inputs.push({ frame, upgradeType: upgrade });
      }
    }

    game = tick(game, frame, input ?? undefined);
  }

  const framesSurvived = game.frameIndex;
  const waveReached = getWaveNumberAtFrame(framesSurvived, params);

  return {
    recording: { seed, params, inputs },
    framesSurvived,
    waveReached,
  };
}

function loadParamOverrides(path: string | undefined): Partial<GameParams> {
  if (!path || path.trim() === "") return {};
  try {
    const raw = readFileSync(resolve(process.cwd(), path), "utf-8");
    return JSON.parse(raw) as Partial<GameParams>;
  } catch (e) {
    console.error("Failed to load params file:", path, e);
    return {};
  }
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const i = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(i);
  const hi = Math.ceil(i);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (i - lo) * (sorted[hi] - sorted[lo]);
}

function computeProfileStats(
  frames: number[],
  waves: number[],
  bestFrames: number,
  bestWave: number
): ProfileStats {
  const n = frames.length;
  const framesSorted = [...frames].sort((a, b) => a - b);
  const wavesSorted = [...waves].sort((a, b) => a - b);
  const meanF = frames.reduce((a, b) => a + b, 0) / n;
  const varianceF = n > 0 ? frames.reduce((acc, x) => acc + (x - meanF) ** 2, 0) / n : 0;
  const stdF = Math.sqrt(varianceF);
  const meanW = waves.reduce((a, b) => a + b, 0) / n;

  return {
    runs: n,
    meanFrames: meanF,
    stdFrames: stdF,
    minFrames: framesSorted[0] ?? 0,
    maxFrames: framesSorted[n - 1] ?? 0,
    p10Frames: percentile(framesSorted, 10),
    p50Frames: percentile(framesSorted, 50),
    p90Frames: percentile(framesSorted, 90),
    meanWave: meanW,
    minWave: wavesSorted[0] ?? 0,
    maxWave: wavesSorted[n - 1] ?? 0,
    bestFrames,
    bestWave,
    pctOfTarget: (meanF / TARGET_FRAMES_10MIN) * 100,
    pctOfPeak: (meanF / PEAK_TARGET_FRAMES) * 100,
  };
}

function printProfileStats(profile: ProfileKind, s: ProfileStats): void {
  const labels: Record<ProfileKind, string> = {
    full: "FULL (toutes les stats)",
    two: "TWO (max 2 stats)",
    one: "ONE (1 seule stat)",
  };
  console.log(`\n=== Profil ${labels[profile]} ===`);
  console.log(`  Runs: ${s.runs}  |  Max run: ${TARGET_FRAMES_10MIN} frames (10 min)  |  Sommet visé: ${PEAK_TARGET_FRAMES} (8 min)`);
  console.log(`  Frames — Min: ${s.minFrames}  |  Max: ${s.maxFrames}  |  Mean: ${s.meanFrames.toFixed(0)} (${s.pctOfPeak.toFixed(1)}% sommet 8 min)  |  Std: ${s.stdFrames.toFixed(0)}`);
  console.log(`  P10: ${s.p10Frames.toFixed(0)}  |  P50: ${s.p50Frames.toFixed(0)}  |  P90: ${s.p90Frames.toFixed(0)}`);
  console.log(`  Vague — Min: ${s.minWave}  |  Max: ${s.maxWave}  |  Mean: ${s.meanWave.toFixed(1)}`);
  console.log(`  Meilleure run: ${s.bestFrames} frames, vague ${s.bestWave}`);
}

function main(): void {
  const args = process.argv.slice(2);
  const runs = Math.max(1, parseInt(args[0] ?? String(DEFAULT_RUNS), 10) || DEFAULT_RUNS);
  const outputDir = args[1] ?? DEFAULT_OUTPUT_DIR;
  const paramsFile = args[2] ?? "gameparams.json";

  const paramOverrides = loadParamOverrides(paramsFile);
  if (Object.keys(paramOverrides).length > 0) {
    console.log("Param overrides loaded from:", paramsFile);
  }

  console.log(`Running ${runs} runs per profile (full, two, one), no render...`);

  const profiles: ProfileKind[] = ["full", "two", "one"];
  const rapportStats: Record<ProfileKind, ProfileStats> = {} as Record<ProfileKind, ProfileStats>;

  for (const profile of profiles) {
    const allFrames: number[] = [];
    const allWaves: number[] = [];
    let best: GameRecording | null = null;
    let bestFrames = 0;
    let bestWave = 0;

    for (let i = 0; i < runs; i++) {
      const seed = randomSeed();
      const { recording, framesSurvived, waveReached } = runOneSimulation(
        seed,
        paramOverrides,
        profile
      );
      allFrames.push(framesSurvived);
      allWaves.push(waveReached);
      if (framesSurvived > bestFrames) {
        bestFrames = framesSurvived;
        bestWave = waveReached;
        best = recording;
      }
    }

    rapportStats[profile] = computeProfileStats(allFrames, allWaves, bestFrames, bestWave);
    printProfileStats(profile, rapportStats[profile]);

    if (best) {
      const outPath = resolve(process.cwd(), outputDir, `best-replay-${profile}.json`);
      writeFileSync(outPath, JSON.stringify(best, null, 2), "utf-8");
      console.log(`  Replay sauvegardé: ${outPath}`);
    }
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const rapport: SimulationRapport = {
    timestamp: new Date().toISOString(),
    paramsFile: paramsFile || undefined,
    params: paramOverrides,
    runsPerProfile: runs,
    targetFrames10Min: TARGET_FRAMES_10MIN,
    targetPeakFrames: PEAK_TARGET_FRAMES,
    stats: rapportStats,
  };

  const rapportPath = resolve(process.cwd(), RAPPORT_DIR);
  mkdirSync(rapportPath, { recursive: true });
  const rapportFile = resolve(rapportPath, `rapport-${timestamp}.json`);
  writeFileSync(rapportFile, JSON.stringify(rapport, null, 2), "utf-8");

  console.log("\n--- Objectif équilibrage: courbe normale, moyenne ~8 min (sommet), max 10 min ---");
  console.log(`Rapport (params + stats) sauvegardé: ${rapportFile}`);
  console.log("Tu peux modifier les params entre chaque test et relancer; les rapports restent dans rapport/.");
}

main();
