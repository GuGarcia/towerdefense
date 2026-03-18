/**
 * Player bootstrap: 1 or N players side by side. Records inputs for export; supports loading a recording for replay.
 * Exported runPlayer() is used when mounting the game from the React app (e.g. /play route).
 */
import { createGame, tick, type Game, type GameInput } from "./domain/game/Game";
import { createGameParams } from "./domain/game/GameParams";
import { GameState } from "./domain/game/GameState";
import { getWaveNumberAtFrame, getWaveEnemyStats } from "./domain/wave/WaveSpawner";
import { getUpgradeLevel } from "./domain/player/Player";
import { getUpgradeCost } from "./domain/economy/UpgradeCost";
import { createRafClock } from "./infrastructure/clock/FixedClock";
import { createCanvasRenderer } from "./infrastructure/rendering/CanvasRenderer";
import { createPlayerInputRecorder } from "./infrastructure/replay/PlayerInputRecorder";
import { createReplayInputSource } from "./infrastructure/replay/ReplayInputSource";
import type { GameRecording } from "./infrastructure/replay/GameRecording";
import {
  setupUpgradeBars,
  UPGRADE_LABELS,
  UPGRADE_TYPES,
} from "./infrastructure/ui/setupUpgradeBars";
import { setupGameOverlay } from "./infrastructure/ui/setupGameOverlay";
import {
  getStoredMeta,
  LIFE_DELTA_PER_LEVEL,
  DAMAGE_DELTA_PER_LEVEL,
  getDifficultyPercent,
} from "../app/metaStorage";

const PLAYER_COUNT = 1;

function randomSeed(): number {
  return Math.floor(Math.random() * 0x7fffffff);
}

async function loadGameParams(): Promise<Record<string, unknown>> {
  try {
    const res = await fetch("/gameparams.json");
    if (res.ok) {
      const json = (await res.json()) as Record<string, unknown>;
      return json ?? {};
    }
  } catch {
    // fallback: use defaults from createGameParams
  }
  return {};
}

function getUpgradeValue(
  player: {
    damage: number;
    maxLife: number;
    regen: number;
    attackSpeed: number;
    range: number;
    armorPercent: number;
    armorFixed: number;
  },
  key: (typeof UPGRADE_TYPES)[number]
): string {
  const v =
    key === "damage"
      ? player.damage
      : key === "life"
        ? player.maxLife
        : key === "regen"
          ? player.regen
          : key === "attackSpeed"
            ? player.attackSpeed
            : key === "range"
              ? player.range
              : key === "armorPercent"
                ? player.armorPercent
                : key === "armorFixed"
                  ? player.armorFixed
                  : player.range;
  if (key === "regen" || key === "attackSpeed") return v.toFixed(1);
  if (key === "armorPercent") return `${Math.round(v)}%`;
  return String(Math.round(v));
}

export interface ReplaySummary {
  wave: number;
  timeSeconds: number;
  enemiesKilled: number;
}

export interface RunEndPayload {
  coinsEarned: number;
  waveNumber: number;
}

export interface RunPlayerOptions {
  /** Override game params (merged with loaded gameparams.json). */
  paramsOverrides?: Record<string, unknown>;
  /** Called when user clicks "Retour au menu" on game over (e.g. navigate to /). */
  onBackToMenu?: () => void;
  /** Called once per run when the simulation reaches GameOver (death). */
  onRunEnd?: (payload: RunEndPayload) => void;
  /** When true, automatically buy the cheapest affordable upgrade each frame. */
  initialAutoMode?: boolean;
  /** Called when user clicks "Sauvegarder" on game over with (recording, summary). */
  onSaveReplay?: (recording: GameRecording, summary: ReplaySummary) => void;
  /** Label for the save button in game over overlay (e.g. "Sauvegarder"). */
  saveButtonLabel?: string;
}

/** Data for the info panel (seed + enemy stats for current wave). */
export interface InfoPanelData {
  seed: number;
  waveNumber: number;
  stats: ReturnType<typeof getWaveEnemyStats>;
}

export type RunPlayerControls = {
  stop: () => void;
  pause: () => void;
  resume: () => void;
  setSpeedMultiplier: (n: number) => void;
  setAutoMode: (on: boolean) => void;
  getSeed: () => number;
  getInfoPanelData: () => InfoPanelData;
  /** Coins earned so far in the current run (depends on deterministic simulation state). */
  getCoinsEarned: () => number;
  /** True when the simulation is in GameOver state. */
  isGameOver: () => boolean;
  /** Wave number corresponding to the current frame (for quit milestones). */
  getWaveNumberReached: () => number;
  exportRecording: () => void;
  loadReplay: (recording: GameRecording) => void;
};

/**
 * Starts the game. Expects DOM elements #game, #upgrade-bars, #game-overlay to exist.
 * Returns a promise that resolves with stop(), pause(), resume(), setSpeedMultiplier(), exportRecording(), loadReplay().
 * Toolbar (speed, export, load) is not rendered by the player; the app places them in the pause bar and pause menu.
 */
export async function runPlayer(options: RunPlayerOptions = {}): Promise<RunPlayerControls> {
  const {
    paramsOverrides: optionsOverrides = {},
    onBackToMenu,
    onRunEnd,
    initialAutoMode = false,
    onSaveReplay,
    saveButtonLabel,
  } = options;
  let autoMode = initialAutoMode;

  const canvasEl = document.getElementById("game") as HTMLCanvasElement | null;
  const noopControls: RunPlayerControls = {
    stop: () => {},
    pause: () => {},
    resume: () => {},
    setSpeedMultiplier: () => {},
    setAutoMode: () => {},
    getSeed: () => 0,
    getInfoPanelData: () => ({ seed: 0, waveNumber: 1, stats: { base: { life: 0, speed: 0, damage: 0, size: 0, count: 0 }, rapid: { life: 0, speed: 0, damage: 0, size: 0, count: 0 }, boss: { life: 0, speed: 0, damage: 0, size: 0, count: 0 } } }),
    getCoinsEarned: () => 0,
    isGameOver: () => false,
    getWaveNumberReached: () => 1,
    exportRecording: () => {},
    loadReplay: () => {},
  };
  if (!canvasEl) return Promise.resolve(noopControls);
  const canvas = canvasEl;
  const ctxOrNull = canvas.getContext("2d");
  if (!ctxOrNull) return Promise.resolve(noopControls);
  const ctx = ctxOrNull;

  const n = PLAYER_COUNT;
  const seeds = Array.from({ length: n }, () => randomSeed());

  const fileOverrides = await loadGameParams();
  const storedMeta = getStoredMeta();

  const baseOverrides = {
    ...fileOverrides,
    ...optionsOverrides,
  };

  // Resolve base player stats (defaults or custom overrides), then apply meta deltas.
  const baseGameParams = createGameParams(baseOverrides as Parameters<typeof createGameParams>[0]);
  const lifeDelta = storedMeta.lifeLevel * LIFE_DELTA_PER_LEVEL;
  const damageDelta = storedMeta.damageLevel * DAMAGE_DELTA_PER_LEVEL;
  const difficultyPercent = getDifficultyPercent(storedMeta);

  const paramsOverrides = {
    ...baseOverrides,
    player: {
      ...(((baseOverrides as unknown as { player?: Record<string, unknown> }).player ?? {}) as Record<string, unknown>),
      initialLife: baseGameParams.player.initialLife + lifeDelta,
      initialMaxLife: baseGameParams.player.initialMaxLife + lifeDelta,
      initialDamage: baseGameParams.player.initialDamage + damageDelta,
    },
    economy: {
      ...(baseOverrides as Record<string, unknown>).economy as Record<string, unknown>,
      coinPerWaveBase: storedMeta.coinPerWaveBase,
      coinPerWavePercent: storedMeta.coinPerWavePercent,
      coinPerBossBase: storedMeta.coinPerBossBase,
    },
    wave: {
      ...(((baseOverrides as unknown as { wave?: Record<string, unknown> }).wave ?? {}) as Record<string, unknown>),
      difficultyPercent,
    },
  };
  const games = seeds.map((seed) =>
    createGame(createGameParams({ ...paramsOverrides, seed } as Parameters<typeof createGameParams>[0]))
  );
  const gameStates: Game[] = games.slice();
  const pendingInputs: (GameInput | null)[] = Array(n).fill(null);
  const frameIndices = Array(n).fill(0);

  const recorder = createPlayerInputRecorder();
  let isReplay = false;
  let replayGetInput: ((frame: number) => GameInput | null) | null = null;
  let speedMultiplier = 1;
  let hasReportedEnd = false;

  /** Returns the cheapest affordable upgrade, or null. Used when autoMode is on. */
  function getAutoUpgrade(game: Game): GameInput | null {
    let best: { key: (typeof UPGRADE_TYPES)[number]; cost: number } | null = null;
    for (const key of UPGRADE_TYPES) {
      const level = getUpgradeLevel(game.player, key);
      const cost = getUpgradeCost(key, level, game.params);
      if (game.money >= cost && (!best || cost < best.cost)) best = { key, cost };
    }
    return best ? { buyUpgrade: best.key } : null;
  }

  function getInputForFrame(playerIndex: number, frame: number): GameInput | null {
    if (isReplay && replayGetInput) return replayGetInput(frame);
    if (autoMode && !pendingInputs[playerIndex]) {
      const game = gameStates[playerIndex];
      const autoInput = getAutoUpgrade(game);
      if (autoInput?.buyUpgrade) {
        pendingInputs[playerIndex] = autoInput;
        if (!isReplay) recorder.record(frameIndices[playerIndex], autoInput.buyUpgrade);
      }
    }
    const input = pendingInputs[playerIndex];
    pendingInputs[playerIndex] = null;
    return input ?? null;
  }

  const upgradeBarsEl = document.getElementById("upgrade-bars");
  if (!upgradeBarsEl) return Promise.resolve(noopControls);
  const barsContainer = upgradeBarsEl;

  function doExport(): void {
    if (isReplay || gameStates.length === 0) return;
    const recording: GameRecording = recorder.getRecording(seeds[0], gameStates[0].params);
    const blob = new Blob([JSON.stringify(recording, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `replay-${recording.seed}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function doLoadReplay(recording: GameRecording): void {
    const params = createGameParams({ ...recording.params, seed: recording.seed });
    gameStates.length = 0;
    gameStates.push(createGame(params));
    seeds.length = 0;
    seeds.push(recording.seed);
    frameIndices.length = 0;
    frameIndices.push(0);
    isReplay = true;
    replayGetInput = createReplayInputSource(recording);
  }

  function getSaveReplayPayload(): { recording: GameRecording; summary: ReplaySummary } | null {
    if (isReplay || gameStates.length === 0) return null;
    const game = gameStates.find((g) => g.state === GameState.GameOver);
    if (!game) return null;
    const recording: GameRecording = recorder.getRecording(seeds[0], game.params);
    const summary: ReplaySummary = {
      wave: getWaveNumberAtFrame(game.frameIndex, game.params),
      timeSeconds: game.frameIndex / 60,
      enemiesKilled: game.enemiesKilled,
    };
    return { recording, summary };
  }

  const gameOverlayEl = setupGameOverlay(canvas, document.getElementById("game-overlay"), {
    onReplayClick: () => {
      if (isReplay) {
        location.reload();
        return;
      }
      recorder.clear();
      hasReportedEnd = false;
      for (let i = 0; i < n; i++) {
        seeds[i] = randomSeed();
        gameStates[i] = createGame(
          createGameParams({ ...paramsOverrides, seed: seeds[i] } as Parameters<typeof createGameParams>[0])
        );
        frameIndices[i] = 0;
      }
    },
    onBackToMenu,
    getSaveReplayPayload: onSaveReplay ? getSaveReplayPayload : undefined,
    onSaveReplay,
    saveButtonLabel,
  });

  setupUpgradeBars(barsContainer, n, {
    onUpgradeClick: (playerIndex, key) => {
      pendingInputs[playerIndex] = { buyUpgrade: key };
      if (!isReplay) recorder.record(frameIndices[playerIndex], key);
    },
  });

  function updateUpgradeBarsUI(): void {
    const anyGameOver = gameStates.some((g) => g.state === GameState.GameOver);
    if (upgradeBarsEl) upgradeBarsEl.classList.toggle("is-game-over", anyGameOver);
    if (gameOverlayEl) {
      gameOverlayEl.classList.toggle("visible", anyGameOver);
      gameOverlayEl.style.display = anyGameOver ? "flex" : "none";
      const titleEl = gameOverlayEl.querySelector<HTMLElement>(".game-over-title");
      const statsEl = gameOverlayEl.querySelector<HTMLElement>(".game-over-stats");
      const btnEl = gameOverlayEl.querySelector<HTMLButtonElement>(".btn-replay-overlay");
      if (titleEl) titleEl.textContent = anyGameOver && isReplay ? "Replay terminé" : "GAME OVER";
      if (statsEl && anyGameOver) {
        const game = gameStates.find((g) => g.state === GameState.GameOver) ?? gameStates[0];
        const wave = getWaveNumberAtFrame(game.frameIndex, game.params);
        const timeSec = game.frameIndex / 60;
        const min = Math.floor(timeSec / 60);
        const s = Math.floor(timeSec % 60);
        const timeStr = min > 0 ? `${min} min ${s} s` : `${s} s`;
        statsEl.textContent = `Vague ${wave} · Ennemis tués ${game.enemiesKilled} · Temps écoulé ${timeStr}`;
      }
      if (btnEl) btnEl.textContent = isReplay ? "Nouvelle partie" : "Rejouer";
    }
    barsContainer.querySelectorAll<HTMLElement>(".player-upgrade-bar").forEach((bar, i) => {
      const game = gameStates[i];
      if (i >= gameStates.length || !game) return;
      const moneyEl = bar.querySelector<HTMLElement>(".player-money");
      if (moneyEl) moneyEl.textContent = `$ ${game.money}`;
      const lifeBarFill = bar.querySelector<HTMLElement>(".life-bar-fill");
      if (lifeBarFill) {
        const pct = game.player.maxLife > 0 ? (game.player.life / game.player.maxLife) * 100 : 0;
        lifeBarFill.style.width = `${Math.max(0, Math.min(100, pct))}%`;
      }
      bar.querySelectorAll<HTMLButtonElement>("button[data-upgrade]").forEach((btn) => {
        const raw = btn.getAttribute("data-upgrade");
        const key = UPGRADE_TYPES.find((k) => k === raw);
        if (!key) return;
        const level = getUpgradeLevel(game.player, key);
        const cost = getUpgradeCost(key, level, game.params);
        const canAfford = game.money >= cost;
        const value = getUpgradeValue(game.player, key);
        btn.textContent = `${UPGRADE_LABELS[key] ?? key} ($${cost}) — ${value}`;
        btn.disabled = isReplay || !canAfford;
      });
    });
  }

  function resize(): void {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  const renderer = createCanvasRenderer(canvas, () => 1);
  let currentStopClock: () => void = createRafClock(step);

  function getViewports(): { x: number; y: number; width: number; height: number }[] {
    const w = canvas.width;
    const h = canvas.height;
    const gap = 2;
    const count = gameStates.length;
    const slotWidth = (w - (count - 1) * gap) / count;
    const viewports: { x: number; y: number; width: number; height: number }[] = [];
    for (let i = 0; i < count; i++) {
      viewports.push({
        x: i * (slotWidth + gap),
        y: 0,
        width: slotWidth,
        height: h,
      });
    }
    return viewports;
  }

  function step(): void {
    for (let s = 0; s < speedMultiplier; s++) {
      for (let i = 0; i < gameStates.length; i++) {
        const prevState = gameStates[i].state;
        const input = getInputForFrame(i, frameIndices[i]);
        gameStates[i] = tick(gameStates[i], frameIndices[i], input ?? undefined);
        if (!hasReportedEnd && prevState !== GameState.GameOver && gameStates[i].state === GameState.GameOver) {
          hasReportedEnd = true;
          const waveNumber = Math.max(1, getWaveNumberAtFrame(gameStates[i].frameIndex, gameStates[i].params));
          onRunEnd?.({ coinsEarned: gameStates[i].coinsEarned, waveNumber });
        }
        frameIndices[i] += 1;
      }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const viewports = getViewports();
    for (let i = 0; i < gameStates.length; i++) {
      renderer(gameStates[i], viewports[i], { showEnemyStats: false });
    }
    updateUpgradeBarsUI();
  }

  step();

  return {
    stop: () => {
      window.removeEventListener("resize", resize);
      currentStopClock();
    },
    pause: () => {
      currentStopClock();
    },
    resume: () => {
      currentStopClock = createRafClock(step);
    },
    setSpeedMultiplier: (s) => {
      speedMultiplier = s;
    },
    setAutoMode: (on) => {
      autoMode = on;
    },
    getSeed: () => seeds[0],
    getInfoPanelData: () => {
      const game = gameStates[0];
      const waveNumber = game ? Math.max(1, getWaveNumberAtFrame(game.frameIndex, game.params)) : 1;
      const params = game?.params ?? createGameParams();
      return { seed: seeds[0], waveNumber, stats: getWaveEnemyStats(params, waveNumber) };
    },
    getCoinsEarned: () => gameStates[0]?.coinsEarned ?? 0,
    isGameOver: () => gameStates.some((g) => g.state === GameState.GameOver),
    getWaveNumberReached: () => {
      const game = gameStates[0];
      if (!game) return 1;
      return Math.max(1, getWaveNumberAtFrame(game.frameIndex, game.params));
    },
    exportRecording: doExport,
    loadReplay: doLoadReplay,
  };
}
