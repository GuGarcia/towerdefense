/**
 * Draws game state on a canvas (background, player pentagon, enemies, projectiles). Theme-driven (default: neon/synthwave).
 */
import type { Game } from "../../domain/game/Game";
import type { GameParams } from "../../domain/game/GameParams";
import type { Enemy } from "../../domain/enemy/Enemy";
import type { Projectile } from "../../domain/projectile/Projectile";
import {
  getWaveNumberAtFrame,
  getWaveStartFrame,
  getWaveComposition,
  getWaveEnemyStats,
} from "../../domain/wave/WaveSpawner";
import { NEON_THEME, type RenderTheme } from "./theme";

function drawPentagon(ctx: CanvasRenderingContext2D, radius: number, theme: RenderTheme): void {
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    const x = Math.cos(a) * radius;
    const y = Math.sin(a) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = theme.playerFill;
  ctx.fill();
  ctx.strokeStyle = theme.playerStroke;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawRangeCircle(ctx: CanvasRenderingContext2D, range: number, theme: RenderTheme): void {
  if (range <= 0) return;
  ctx.beginPath();
  ctx.arc(0, 0, range, 0, Math.PI * 2);
  ctx.strokeStyle = theme.accentDim;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 6]);
  ctx.stroke();
  ctx.setLineDash([]);
}

/** Angle so that one edge of the square faces center. Canvas: normal (0,-1) must align with (-e.x, e.y). */
function angleTowardCenter(e: Enemy): number {
  return Math.atan2(-e.x, -e.y);
}

function drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy, theme: RenderTheme): void {
  const color =
    e.archetype === "boss" ? theme.enemyBoss : e.archetype === "rapid" ? theme.enemyRapid : theme.enemyBase;
  const cx = e.x;
  const cy = -e.y;
  const size = e.size;
  const angle = angleTowardCenter(e);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.3 + (e.life / e.maxLife) * 0.7;
  ctx.fillRect(-size / 2, -size / 2, size, size);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(-size / 2, -size / 2, size, size);
  if ((e.hitFlashFrames ?? 0) > 0) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.fillRect(-size / 2, -size / 2, size, size);
    ctx.strokeStyle = theme.projectile;
    ctx.strokeRect(-size / 2, -size / 2, size, size);
  }
  ctx.restore();
}

function drawProjectile(ctx: CanvasRenderingContext2D, p: Projectile, theme: RenderTheme): void {
  ctx.beginPath();
  ctx.arc(p.x, -p.y, 4, 0, Math.PI * 2);
  ctx.fillStyle = theme.projectile;
  ctx.fill();
  ctx.strokeStyle = theme.playerStroke;
  ctx.lineWidth = 1;
  ctx.stroke();
}

export interface Viewport {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function createCanvasRenderer(
  canvas: HTMLCanvasElement,
  getScale: () => number,
  theme: RenderTheme = NEON_THEME
): (game: Game, viewport?: Viewport) => void {
  return function render(game: Game, viewport?: Viewport): void {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const vp = viewport ?? { x: 0, y: 0, width: w, height: h };
    const cx = vp.x + vp.width / 2;
    const cy = vp.y + vp.height / 2;
    const scale = viewport
      ? Math.min(vp.width, vp.height) / 1200
      : getScale();

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (!viewport) ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = theme.bg;
    ctx.fillRect(vp.x, vp.y, vp.width, vp.height);

    ctx.save();
    ctx.beginPath();
    ctx.rect(vp.x, vp.y, vp.width, vp.height);
    ctx.clip();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    drawRangeCircle(ctx, game.player.range, theme);

    for (const e of game.enemies) drawEnemy(ctx, e, theme);
    for (const p of game.projectiles) drawProjectile(ctx, p, theme);
    drawPentagon(ctx, 40, theme);

    ctx.restore();

    drawWaveHud(ctx, game, vp, theme);
    drawEnemyStatsHud(ctx, game, vp, theme);
  };
}

function drawWaveHud(
  ctx: CanvasRenderingContext2D,
  game: Game,
  vp: { x: number; y: number; width: number; height: number },
  theme: RenderTheme
): void {
  const params = game.params;
  const frameIndex = game.frameIndex;
  const interval = params.wave?.baseIntervalFrames ?? 300;
  const waveNumber = getWaveNumberAtFrame(frameIndex, params);
  const waveStart = getWaveStartFrame(waveNumber <= 0 ? 1 : waveNumber, params);
  const progress =
    waveNumber <= 0
      ? 0
      : Math.min(1, Math.max(0, (frameIndex - waveStart) / interval));

  const centerX = vp.x + vp.width / 2;
  const topY = vp.y + 20;
  const barWidth = 120;
  const barHeight = 8;
  const barX = centerX - barWidth / 2;
  const barY = topY + 18;

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  ctx.fillStyle = theme.accentMuted;
  ctx.font = "14px monospace";
  ctx.textAlign = "center";
  ctx.fillText(`Vague ${waveNumber <= 0 ? 1 : waveNumber}`, centerX, topY);

  ctx.strokeStyle = theme.accentDim;
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barWidth, barHeight);
  ctx.fillStyle = theme.accentBarBg;
  ctx.fillRect(barX, barY, barWidth, barHeight);
  ctx.fillStyle = theme.accent;
  ctx.fillRect(barX, barY, barWidth * progress, barHeight);

  const nextWave = waveNumber <= 0 ? 1 : waveNumber + 1;
  const comp = getWaveComposition(params, nextWave);
  const nextParts: string[] = [];
  if (comp.base > 0) nextParts.push(`${comp.base} base`);
  if (comp.rapid > 0) nextParts.push(`${comp.rapid} rapid`);
  if (comp.boss > 0) nextParts.push("1 boss");
  ctx.fillStyle = theme.accentMuted;
  ctx.font = "11px monospace";
  ctx.fillText(
    nextParts.length ? `Prochaine vague : ${nextParts.join(", ")}` : "",
    centerX,
    barY + barHeight + 16
  );

  ctx.restore();
}

const ENEMY_TYPE_LABELS: Record<keyof GameParams["enemies"], string> = {
  base: "Base",
  rapid: "Rapide",
  boss: "Boss",
};

function drawEnemyStatsHud(
  ctx: CanvasRenderingContext2D,
  game: Game,
  vp: { x: number; y: number; width: number; height: number },
  theme: RenderTheme
): void {
  const params = game.params;
  const waveNumber = Math.max(1, getWaveNumberAtFrame(game.frameIndex, params));
  const stats = getWaveEnemyStats(params, waveNumber);

  const left = vp.x + 10;
  let top = vp.y + 10;
  const lineHeight = 14;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  ctx.fillStyle = theme.accentMuted;
  ctx.font = "bold 12px monospace";
  ctx.textAlign = "left";
  ctx.fillText(`Ennemis (vague ${waveNumber})`, left, top);
  top += lineHeight + 4;

  const keys: (keyof typeof stats)[] = ["base", "rapid", "boss"];
  for (const key of keys) {
    const s = stats[key];
    ctx.fillStyle = key === "boss" ? theme.enemyBoss : key === "rapid" ? theme.enemyRapid : theme.enemyBase;
    ctx.font = "11px monospace";
    ctx.fillText(ENEMY_TYPE_LABELS[key], left, top);
    top += lineHeight;
    ctx.fillStyle = theme.accentMuted;
    ctx.font = "10px monospace";
    const lifeStr = Math.round(s.life).toString();
    const speedStr = s.speed.toFixed(1);
    const dmgStr = Math.round(s.damage).toString();
    ctx.fillText(`  PV: ${lifeStr}  Vit: ${speedStr}  Dég: ${dmgStr}  Taille: ${s.size}  Nb/vague: ${s.count}`, left, top);
    top += lineHeight + 2;
  }

  ctx.restore();
}
