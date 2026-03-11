/**
 * Use case: advance game by one frame (frameIndex + input) via Game.tick.
 */
import type { Game, GameInput } from "../domain/game/Game";
import { tick } from "../domain/game/Game";

export function runTick(game: Game, frameIndex: number, input?: GameInput | null): Game {
  return tick(game, frameIndex, input);
}
