/**
 * Possible game states (value object / constants).
 */
export const GameState = Object.freeze({
  Playing: "Playing",
  GameOver: "GameOver",
  Victory: "Victory",
} as const);

export type GameStateValue = (typeof GameState)[keyof typeof GameState];
