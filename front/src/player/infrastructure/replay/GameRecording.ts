/**
 * Data structure for a recorded game: seed, params, inputs per frame.
 */
import type { GameParams } from "../../domain/game/GameParams";
import type { UpgradeTypeValue } from "../../domain/player/UpgradeType";

export interface RecordedInput {
  frame: number;
  upgradeType: UpgradeTypeValue;
}

export interface GameRecording {
  seed: number;
  params: GameParams;
  inputs: RecordedInput[];
}
