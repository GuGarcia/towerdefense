/**
 * Entry point: 1 or N players side by side. Change PLAYER_COUNT to test determinism (e.g. 4).
 * Records inputs for export; supports loading a recording for replay.
 */
import { createGame, tick } from "./domain/game/Game";
import { createGameParams } from "./domain/game/GameParams";
import { GameState } from "./domain/game/GameState";
import { getUpgradeLevel } from "./domain/player/Player";
import { getUpgradeCost } from "./domain/economy/UpgradeCost";
import { createFixedClock } from "./infrastructure/clock/FixedClock";
import { createCanvasRenderer } from "./infrastructure/rendering/CanvasRenderer";
import { createPlayerInputRecorder } from "./infrastructure/replay/PlayerInputRecorder";
import { createReplayInputSource } from "./infrastructure/replay/ReplayInputSource";
import type { GameInput } from "./domain/game/Game";
import type { GameRecording } from "./infrastructure/replay/GameRecording";

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

  const recorder = createPlayerInputRecorder();
  let isReplay = false;
  let replayGetInput: ((frame: number) => GameInput | null) | null = null;

  function getInputForFrame(playerIndex: number, frame: number): GameInput | null {
    if (isReplay && replayGetInput) return replayGetInput(frame);
    const input = pendingInputs[playerIndex];
    pendingInputs[playerIndex] = null;
    return input ?? null;
  }

  const upgradeBarsEl = document.getElementById("upgrade-bars");
  if (!upgradeBarsEl) return;
  const barsContainer = upgradeBarsEl;

  const toolbarEl = document.getElementById("replay-toolbar");
  if (toolbarEl) {
    const btnExport = document.createElement("button");
    btnExport.type = "button";
    btnExport.textContent = "Exporter";
    const labelReplay = document.createElement("label");
    labelReplay.textContent = "Charger un replay";
    const inputReplay = document.createElement("input");
    inputReplay.type = "file";
    inputReplay.accept = ".json";
    inputReplay.id = "input-replay";
    labelReplay.htmlFor = inputReplay.id;
    toolbarEl.appendChild(btnExport);
    toolbarEl.appendChild(labelReplay);
    toolbarEl.appendChild(inputReplay);

    btnExport.addEventListener("click", () => {
      if (isReplay || gameStates.length === 0) return;
      const recording: GameRecording = recorder.getRecording(seeds[0], gameStates[0].params);
      const blob = new Blob([JSON.stringify(recording, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `replay-${recording.seed}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    });

    inputReplay.addEventListener("change", () => {
      const file = inputReplay.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const raw = reader.result as string;
          const recording = JSON.parse(raw) as GameRecording;
          if (typeof recording.seed !== "number" || !recording.params || !Array.isArray(recording.inputs)) {
            alert("Fichier replay invalide.");
            return;
          }
          const params = createGameParams({ ...recording.params, seed: recording.seed });
          gameStates.length = 0;
          gameStates.push(createGame(params));
          seeds.length = 0;
          seeds.push(recording.seed);
          frameIndices.length = 0;
          frameIndices.push(0);
          isReplay = true;
          replayGetInput = createReplayInputSource(recording);
          inputReplay.value = "";
        } catch {
          alert("Erreur lors du chargement du replay.");
        }
      };
      reader.readAsText(file);
    });
  }

  let gameOverlayEl = document.getElementById("game-overlay");
  let gameWrapperEl = document.getElementById("game-wrapper");
  if (!gameWrapperEl && canvas.parentElement) {
    gameWrapperEl = document.createElement("div");
    gameWrapperEl.id = "game-wrapper";
    gameWrapperEl.style.cssText = "position:relative;flex:1;min-height:0;display:flex;";
    canvas.parentElement.insertBefore(gameWrapperEl, canvas);
    gameWrapperEl.appendChild(canvas);
  }
  if (!gameOverlayEl && gameWrapperEl) {
    gameOverlayEl = document.createElement("div");
    gameOverlayEl.id = "game-overlay";
    gameOverlayEl.style.cssText =
      "position:absolute;left:0;top:0;right:0;bottom:0;z-index:10;display:none;flex-direction:column;align-items:center;justify-content:center;gap:24px;background:rgba(0,0,0,0.6);";
    const title = document.createElement("span");
    title.className = "game-over-title";
    title.style.cssText = "font:bold 56px monospace;color:#ff3366;";
    title.textContent = "GAME OVER";
    const replayBtn = document.createElement("button");
    replayBtn.type = "button";
    replayBtn.className = "btn-replay-overlay";
    replayBtn.textContent = "Rejouer";
    replayBtn.style.cssText =
      "padding:12px 28px;font:600 18px monospace;color:#00ffcc;background:rgba(0,255,204,0.15);border:2px solid #00ffcc;border-radius:6px;cursor:pointer;";
    gameOverlayEl.appendChild(title);
    gameOverlayEl.appendChild(replayBtn);
    gameWrapperEl.appendChild(gameOverlayEl);
  }
  const replayOverlayBtn = gameOverlayEl?.querySelector<HTMLButtonElement>(".btn-replay-overlay");

  if (replayOverlayBtn) {
    replayOverlayBtn.addEventListener("click", () => {
      if (isReplay) {
        location.reload();
        return;
      }
      recorder.clear();
      for (let i = 0; i < n; i++) {
        seeds[i] = randomSeed();
        gameStates[i] = createGame(createGameParams({ seed: seeds[i] }));
        frameIndices[i] = 0;
      }
    });
  }

  const upgradeTypes = ["damage", "life", "regen", "attackSpeed"] as const;
  for (let i = 0; i < n; i++) {
    const bar = document.createElement("div");
    bar.className = "player-upgrade-bar";
    bar.setAttribute("data-player", String(i + 1));

    const lifeBarWrap = document.createElement("div");
    lifeBarWrap.className = "life-bar";
    lifeBarWrap.style.cssText =
      "width:100px;min-width:100px;height:14px;flex-shrink:0;background:rgba(0,0,0,0.6);border:1px solid #ff3366;border-radius:4px;overflow:hidden;display:flex;align-items:stretch;box-sizing:border-box;";
    const lifeBarFill = document.createElement("div");
    lifeBarFill.className = "life-bar-fill";
    lifeBarFill.style.cssText =
      "height:100%;background:linear-gradient(90deg,#ff3366,#ff6699);border-radius:2px;transition:width 0.1s ease-out;";
    lifeBarFill.style.width = "100%";
    lifeBarWrap.appendChild(lifeBarFill);
    bar.appendChild(lifeBarWrap);

    const buttonsWrap = document.createElement("div");
    buttonsWrap.className = "upgrade-buttons";
    for (const key of upgradeTypes) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("data-upgrade", key);
      btn.textContent = `${UPGRADE_LABELS[key]} ($50)`;
      const playerIndex = i;
      btn.addEventListener("click", () => {
        if (btn.disabled) return;
        pendingInputs[playerIndex] = { buyUpgrade: key };
        if (!isReplay) recorder.record(frameIndices[playerIndex], key);
      });
      buttonsWrap.appendChild(btn);
    }
    bar.appendChild(buttonsWrap);

    const moneyEl = document.createElement("span");
    moneyEl.className = "player-money";
    moneyEl.style.cssText =
      "font-family:monospace;font-size:15px;font-weight:700;color:#ffd700;text-shadow:0 0 10px rgba(255,215,0,0.6);min-width:4ch;flex-shrink:0;";
    moneyEl.textContent = "$ 0";
    bar.appendChild(moneyEl);

    barsContainer.appendChild(bar);
  }

  function getUpgradeValue(
    player: { damage: number; maxLife: number; regen: number; attackSpeed: number },
    key: "damage" | "life" | "regen" | "attackSpeed"
  ): string {
    const v =
      key === "damage"
        ? player.damage
        : key === "life"
          ? player.maxLife
          : key === "regen"
            ? player.regen
            : player.attackSpeed;
    if (key === "regen" || key === "attackSpeed") return v.toFixed(1);
    return String(Math.round(v));
  }

  function updateUpgradeBarsUI(): void {
    const anyGameOver = gameStates.some((g) => g.state === GameState.GameOver);
    if (upgradeBarsEl) {
      upgradeBarsEl.classList.toggle("is-game-over", anyGameOver);
      upgradeBarsEl.classList.toggle("is-replay", isReplay);
    }
    if (gameOverlayEl) {
      gameOverlayEl.classList.toggle("visible", anyGameOver);
      gameOverlayEl.style.display = anyGameOver ? "flex" : "none";
      const titleEl = gameOverlayEl.querySelector<HTMLElement>(".game-over-title");
      const btnEl = gameOverlayEl.querySelector<HTMLButtonElement>(".btn-replay-overlay");
      if (titleEl) titleEl.textContent = anyGameOver && isReplay ? "Replay terminé" : "GAME OVER";
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
        if (raw !== "damage" && raw !== "life" && raw !== "regen" && raw !== "attackSpeed") return;
        const level = getUpgradeLevel(game.player, raw);
        const cost = getUpgradeCost(raw, level, game.params);
        const canAfford = game.money >= cost;
        const value = getUpgradeValue(game.player, raw);
        btn.textContent = `${UPGRADE_LABELS[raw] ?? raw} ($${cost}) — ${value}`;
        btn.disabled = !canAfford;
      });
    });
  }

  // Ensure overlay is hidden on init (in case HTML has it visible or CSS loads late)
  if (gameOverlayEl) {
    gameOverlayEl.style.display = "none";
    gameOverlayEl.classList.remove("visible");
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
    for (let i = 0; i < gameStates.length; i++) {
      const input = getInputForFrame(i, frameIndices[i]);
      gameStates[i] = tick(gameStates[i], frameIndices[i], input ?? undefined);
      frameIndices[i] += 1;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const viewports = getViewports();
    for (let i = 0; i < gameStates.length; i++) {
      renderer(gameStates[i], viewports[i]);
      drawSeedTopRight(ctx, viewports[i], seeds[i]);
    }
    updateUpgradeBarsUI();
  }

  createFixedClock(step);
  step();
}

main();
