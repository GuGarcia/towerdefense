/**
 * Entry point: creates game, clock, renderer, input source, GameRunner; starts the loop.
 */
import { createGame } from "./domain/game/Game";
import { createGameParams } from "./domain/game/GameParams";
import { UpgradeType } from "./domain/player/UpgradeType";
import { createGameRunner } from "./application/services/GameRunner";
import { createFixedClock } from "./infrastructure/clock/FixedClock";
import { createCanvasRenderer } from "./infrastructure/rendering/CanvasRenderer";
import { createPlayerInputRecorder } from "./infrastructure/replay/PlayerInputRecorder";
import type { GameInput } from "./domain/game/Game";
import type { Game } from "./domain/game/Game";

function main(): void {
  const canvasEl = document.getElementById("game") as HTMLCanvasElement | null;
  if (!canvasEl) return;
  const canvas = canvasEl;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const params = createGameParams({ seed: Math.floor(Math.random() * 1e6) });
  let game = createGame(params);
  const recorder = createPlayerInputRecorder();

  let pendingInput: GameInput | null = null;

  const keyToUpgrade: Record<string, GameInput["buyUpgrade"]> = {
    "1": UpgradeType.Damage,
    "2": UpgradeType.Life,
    "3": UpgradeType.Regen,
    "4": UpgradeType.AttackSpeed,
  };

  document.addEventListener("keydown", (e) => {
    const upgrade = keyToUpgrade[e.key];
    if (upgrade) {
      pendingInput = { buyUpgrade: upgrade };
      e.preventDefault();
    }
  });

  function resize(): void {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  const scale = 1;
  const renderer = createCanvasRenderer(canvas, () => scale);

  const inputSource = (frameIndex: number): GameInput | null => {
    const input = pendingInput;
    pendingInput = null;
    if (input?.buyUpgrade) recorder.record(frameIndex, input.buyUpgrade);
    return input ?? null;
  };

  createGameRunner(
    () => game,
    (g: Game) => {
      game = g;
    },
    inputSource,
    renderer,
    createFixedClock
  );

  renderer(game);
}

main();
