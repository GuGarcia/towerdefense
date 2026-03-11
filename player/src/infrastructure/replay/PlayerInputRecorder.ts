/**
 * Records player inputs (upgrade purchases) by frame for replay.
 */
import type { GameRecording, RecordedInput } from "./GameRecording";

export function createPlayerInputRecorder(): {
  record: (frame: number, upgradeType: string) => void;
  getRecording: (seed: number, params: GameRecording["params"]) => GameRecording;
  clear: () => void;
} {
  const inputs: RecordedInput[] = [];

  return {
    record(frame: number, upgradeType: string) {
      inputs.push({ frame, upgradeType });
    },
    getRecording(seed: number, params: GameRecording["params"]): GameRecording {
      return { seed, params, inputs: [...inputs] };
    },
    clear() {
      inputs.length = 0;
    },
  };
}
