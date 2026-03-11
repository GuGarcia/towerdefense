/**
 * Entry point: 1 or N players side by side. Change PLAYER_COUNT to test determinism (e.g. 4).
 */
import { createGame, tick } from "./domain/game/Game";
import { createGameParams } from "./domain/game/GameParams";
import { GameState } from "./domain/game/GameState";
import { getUpgradeLevel } from "./domain/player/Player";
import { getUpgradeCost } from "./domain/economy/UpgradeCost";
import { createFixedClock } from "./infrastructure/clock/FixedClock";
import { createCanvasRenderer } from "./infrastructure/rendering/CanvasRenderer";
import type { GameInput } from "./domain/game/Game";

const PLAYER_COUNT = 1;

const UPGRADE_LABELS: Record<string, string> = {
  damage: "Dmg",
  life: "Life",
  regen: "Regen",
  attackSpeed: "Spd",
};

function randomSeed(): number {
  return Math.floor(Math.random() * 0x7fffffff);
}

function main(): void {
  const canvasEl = document.getElementById("game") as HTMLCanvasElement | null;
  if (!canvasEl) return;
  const canvas = canvasEl;
  const ctxOrNull = canvas.getContext("2d");
  if (!ctxOrNull) return;
  const ctx = ctxOrNull;

  const n = PLAYER_COUNT;
  const seeds = Array.from({ length: n }, () => randomSeed());

  const games = seeds.map((seed) => createGame(createGameParams({ seed })));
  const gameStates = games.slice();
  const pendingInputs: (GameInput | null)[] = Array(n).fill(null);
  const frameIndices = Array(n).fill(0);

  const upgradeBarsEl = document.getElementById("upgrade-bars");
  if (!upgradeBarsEl) return;
  const barsContainer = upgradeBarsEl;

  const upgradeTypes = ["damage", "life", "regen", "attackSpeed"] as const;
  for (let i = 0; i < n; i++) {
    const bar = document.createElement("div");
    bar.className = "player-upgrade-bar";
    bar.setAttribute("data-player", String(i + 1));
    for (const key of upgradeTypes) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("data-upgrade", key);
      btn.textContent = `${UPGRADE_LABELS[key]} ($50)`;
      const playerIndex = i;
      btn.addEventListener("click", () => {
        if (btn.disabled) return;
        pendingInputs[playerIndex] = { buyUpgrade: key };
      });
      bar.appendChild(btn);
    }
    barsContainer.appendChild(bar);
  }

  function updateUpgradeBarsUI(): void {
    barsContainer.querySelectorAll<HTMLElement>(".player-upgrade-bar").forEach((bar, i) => {
      const game = gameStates[i];
      if (i >= gameStates.length || !game) return;
      const isGameOver = game.state === GameState.GameOver;
      bar.classList.toggle("is-game-over", isGameOver);
      const money = game.money;
      const params = game.params;
      bar.querySelectorAll<HTMLButtonElement>("button[data-upgrade]").forEach((btn) => {
        const raw = btn.getAttribute("data-upgrade");
        if (raw !== "damage" && raw !== "life" && raw !== "regen" && raw !== "attackSpeed") return;
        const level = getUpgradeLevel(game.player, raw);
        const cost = getUpgradeCost(raw, level, params);
        const canAfford = money >= cost;
        btn.textContent = `${UPGRADE_LABELS[raw] ?? raw} ($${cost})`;
        btn.disabled = isGameOver || !canAfford;
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

  function getViewports(): { x: number; y: number; width: number; height: number }[] {
    const w = canvas.width;
    const h = canvas.height;
    const gap = 2;
    const slotWidth = (w - (n - 1) * gap) / n;
    const viewports: { x: number; y: number; width: number; height: number }[] = [];
    for (let i = 0; i < n; i++) {
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
    for (let i = 0; i < n; i++) {
      const input = pendingInputs[i];
      pendingInputs[i] = null;
      gameStates[i] = tick(gameStates[i], frameIndices[i], input ?? undefined);
      frameIndices[i] += 1;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const viewports = getViewports();
    for (let i = 0; i < n; i++) {
      renderer(gameStates[i], viewports[i]);
      drawSeedTopRight(ctx, viewports[i], seeds[i]);
    }
    updateUpgradeBarsUI();
  }

  createFixedClock(step);
  step();
}

main();
