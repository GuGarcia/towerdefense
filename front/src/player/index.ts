/**
 * Player bootstrap: 1 or N players side by side. Records inputs for export; supports loading a recording for replay.
 * Exported runPlayer() is used when mounting the game from the React app (e.g. /play route).
 */
import { createGame, tick, type Game, type GameInput } from "./domain/game/Game";
import { createGameParams } from "./domain/game/GameParams";
import { GameState } from "./domain/game/GameState";
import { getWaveNumberAtFrame } from "./domain/wave/WaveSpawner";
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
  player: { damage: number; maxLife: number; regen: number; attackSpeed: number; range: number },
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
            : player.range;
  if (key === "regen" || key === "attackSpeed") return v.toFixed(1);
  return String(Math.round(v));
}

export interface RunPlayerOptions {
  /** Override game params (merged with loaded gameparams.json). */
  paramsOverrides?: Record<string, unknown>;
  /** Called when user clicks "Retour au menu" on game over (e.g. navigate to /). */
  onBackToMenu?: () => void;
  /** When true, automatically buy the cheapest affordable upgrade each frame. */
  initialAutoMode?: boolean;
}

export type RunPlayerControls = {
  stop: () => void;
  pause: () => void;
  resume: () => void;
  setSpeedMultiplier: (n: number) => void;
  setAutoMode: (on: boolean) => void;
  exportRecording: () => void;
  loadReplay: (recording: GameRecording) => void;
};

/**
 * Starts the game. Expects DOM elements #game, #upgrade-bars, #game-overlay to exist.
 * Returns a promise that resolves with stop(), pause(), resume(), setSpeedMultiplier(), exportRecording(), loadReplay().
 * Toolbar (speed, export, load) is not rendered by the player; the app places them in the pause bar and pause menu.
 */
export async function runPlayer(options: RunPlayerOptions = {}): Promise<RunPlayerControls> {
  const { paramsOverrides: optionsOverrides = {}, onBackToMenu, initialAutoMode = false } = options;
  let autoMode = initialAutoMode;

  const canvasEl = document.getElementById("game") as HTMLCanvasElement | null;
  const noopControls: RunPlayerControls = {
    stop: () => {},
    pause: () => {},
    resume: () => {},
    setSpeedMultiplier: () => {},
    setAutoMode: () => {},
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
  const paramsOverrides = { ...fileOverrides, ...optionsOverrides };
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

  const gameOverlayEl = setupGameOverlay(canvas, document.getElementById("game-overlay"), {
    onReplayClick: () => {
      if (isReplay) {
        location.reload();
        return;
      }
      recorder.clear();
      for (let i = 0; i < n; i++) {
        seeds[i] = randomSeed();
        gameStates[i] = createGame(
          createGameParams({ ...paramsOverrides, seed: seeds[i] } as Parameters<typeof createGameParams>[0])
        );
        frameIndices[i] = 0;
      }
    },
    onBackToMenu,
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

  function drawSeedTopRight(
    c: CanvasRenderingContext2D,
    vp: { x: number; y: number; width: number; height: number },
    seed: number
  ): void {
    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = "rgba(0, 255, 204, 0.9)";
    c.font = "11px monospace";
    c.textAlign = "right";
    c.fillText(`Seed ${seed}`, vp.x + vp.width - 6, vp.y + 14);
    c.textAlign = "left";
    c.restore();
  }

  function step(): void {
    for (let s = 0; s < speedMultiplier; s++) {
      for (let i = 0; i < gameStates.length; i++) {
        const input = getInputForFrame(i, frameIndices[i]);
        gameStates[i] = tick(gameStates[i], frameIndices[i], input ?? undefined);
        frameIndices[i] += 1;
      }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const viewports = getViewports();
    for (let i = 0; i < gameStates.length; i++) {
      renderer(gameStates[i], viewports[i]);
      drawSeedTopRight(ctx, viewports[i], seeds[i]);
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
    exportRecording: doExport,
    loadReplay: doLoadReplay,
  };
}
