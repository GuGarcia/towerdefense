/**
 * Data structure for a recorded game: seed, params, inputs per frame.
 */
import type { GameParams } from "../../domain/game/GameParams";

export interface RecordedInput {
  frame: number;
  upgradeType: string;
}

export interface GameRecording {
  seed: number;
  params: GameParams;
  inputs: RecordedInput[];
}
