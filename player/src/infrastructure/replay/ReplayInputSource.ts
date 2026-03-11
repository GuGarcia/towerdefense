/**
 * Returns input for a given frame from a GameRecording (for replay).
 */
import type { GameInput } from "../../domain/game/Game";
import type { GameRecording } from "./GameRecording";

export function createReplayInputSource(recording: GameRecording): (frameIndex: number) => GameInput | null {
  const byFrame = new Map<number, GameInput>();
  for (const { frame, upgradeType } of recording.inputs) {
    byFrame.set(frame, { buyUpgrade: upgradeType as GameInput["buyUpgrade"] });
  }
  return (frameIndex: number) => byFrame.get(frameIndex) ?? null;
}
