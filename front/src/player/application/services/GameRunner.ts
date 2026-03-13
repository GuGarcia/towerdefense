/**
 * Orchestrates the game loop: on each clock tick, get input, run game tick, render.
 */
import type { Game } from "../../domain/game/Game";
import type { GameInput } from "../../domain/game/Game";
import { runTick } from "../GameLoop";

export type InputSource = (frameIndex: number) => GameInput | null | undefined;

export type Renderer = (game: Game) => void;

export type Clock = (onTick: () => void) => () => void;

export function createGameRunner(
  getGame: () => Game,
  setGame: (game: Game) => void,
  inputSource: InputSource,
  renderer: Renderer,
  clock: Clock
): () => void {
  let frameIndex = 0;

  function step(): void {
    const game = getGame();
    const input = inputSource(frameIndex);
    const nextGame = runTick(game, frameIndex, input);
    setGame(nextGame);
    renderer(nextGame);
    frameIndex += 1;
  }

  return clock(step);
}
