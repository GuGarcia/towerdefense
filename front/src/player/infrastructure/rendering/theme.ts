/**
 * Render theme: palette for canvas (background, player, enemies, HUD).
 * Allows swapping themes without changing renderer logic.
 */
export interface RenderTheme {
  bg: string;
  playerFill: string;
  playerStroke: string;
  enemyBase: string;
  enemyRapid: string;
  enemyBoss: string;
  projectile: string;
  grid: string;
  /** HUD accent (wave text, progress bar fill). */
  accent: string;
  accentMuted: string;
  accentDim: string;
  /** HUD progress bar background. */
  accentBarBg: string;
}

export const NEON_THEME: RenderTheme = {
  bg: "#0a0a0f",
  playerFill: "#1a1a2e",
  playerStroke: "#00ffcc",
  enemyBase: "#ff6b9d",
  enemyRapid: "#c44dff",
  enemyBoss: "#ff3366",
  projectile: "#00ffcc",
  grid: "rgba(0, 255, 204, 0.06)",
  accent: "#00ffcc",
  accentMuted: "rgba(0, 255, 204, 0.95)",
  accentDim: "rgba(0, 255, 204, 0.5)",
  accentBarBg: "rgba(0, 255, 204, 0.2)",
};
