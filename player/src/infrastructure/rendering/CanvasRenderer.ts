/**
 * Draws game state on a canvas (background, player pentagon, enemies, projectiles). Neon/synthwave style.
 */
import type { Game } from "../../domain/game/Game";
import type { GameParams } from "../../domain/game/GameParams";
import type { Enemy } from "../../domain/enemy/Enemy";
import type { Projectile } from "../../domain/projectile/Projectile";
import { getWaveNumberAtFrame, getWaveStartFrame } from "../../domain/wave/WaveSpawner";

const NEON = {
  bg: "#0a0a0f",
  playerFill: "#1a1a2e",
  playerStroke: "#00ffcc",
  enemyBase: "#ff6b9d",
  enemyRapid: "#c44dff",
  enemyBoss: "#ff3366",
  projectile: "#00ffcc",
  grid: "rgba(0, 255, 204, 0.06)",
};

function drawPentagon(ctx: CanvasRenderingContext2D, radius: number): void {
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    const x = Math.cos(a) * radius;
    const y = Math.sin(a) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = NEON.playerFill;
  ctx.fill();
  ctx.strokeStyle = NEON.playerStroke;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawRangeCircle(ctx: CanvasRenderingContext2D, range: number): void {
  if (range <= 0) return;
  ctx.beginPath();
  ctx.arc(0, 0, range, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(0, 255, 204, 0.5)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 6]);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy): void {
  const color =
    e.archetype === "boss" ? NEON.enemyBoss : e.archetype === "rapid" ? NEON.enemyRapid : NEON.enemyBase;
  ctx.beginPath();
  ctx.arc(e.x, -e.y, e.size, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.3 + (e.life / e.maxLife) * 0.7;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
  if ((e.hitFlashFrames ?? 0) > 0) {
    ctx.beginPath();
    ctx.arc(e.x, -e.y, e.size, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.fill();
    ctx.strokeStyle = NEON.projectile;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function drawProjectile(ctx: CanvasRenderingContext2D, p: Projectile): void {
  ctx.beginPath();
  ctx.arc(p.x, -p.y, 4, 0, Math.PI * 2);
  ctx.fillStyle = NEON.projectile;
  ctx.fill();
  ctx.strokeStyle = NEON.playerStroke;
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
  getScale: () => number
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
    ctx.fillStyle = NEON.bg;
    ctx.fillRect(vp.x, vp.y, vp.width, vp.height);

    ctx.save();
    ctx.beginPath();
    ctx.rect(vp.x, vp.y, vp.width, vp.height);
    ctx.clip();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    // Range circle (portée de tir du joueur)
    drawRangeCircle(ctx, game.player.range);

    for (const e of game.enemies) drawEnemy(ctx, e);
    for (const p of game.projectiles) drawProjectile(ctx, p);
    drawPentagon(ctx, 40);

    ctx.restore();

    drawWaveHud(ctx, game, vp);
    drawEnemyStatsHud(ctx, game.params, vp);
  };
}

function drawWaveHud(
  ctx: CanvasRenderingContext2D,
  game: Game,
  vp: { x: number; y: number; width: number; height: number }
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

  ctx.fillStyle = "rgba(0, 255, 204, 0.95)";
  ctx.font = "14px monospace";
  ctx.textAlign = "center";
  ctx.fillText(`Vague ${waveNumber <= 0 ? 1 : waveNumber}`, centerX, topY);

  ctx.strokeStyle = "rgba(0, 255, 204, 0.5)";
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barWidth, barHeight);
  ctx.fillStyle = "rgba(0, 255, 204, 0.2)";
  ctx.fillRect(barX, barY, barWidth, barHeight);
  ctx.fillStyle = "#00ffcc";
  ctx.fillRect(barX, barY, barWidth * progress, barHeight);

  ctx.restore();
}

const ENEMY_TYPE_LABELS: Record<keyof GameParams["enemies"], string> = {
  base: "Base",
  rapid: "Rapide",
  boss: "Boss",
};

function drawEnemyStatsHud(
  ctx: CanvasRenderingContext2D,
  params: GameParams,
  vp: { x: number; y: number; width: number; height: number }
): void {
  const left = vp.x + 10;
  let top = vp.y + 10;
  const lineHeight = 14;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  ctx.fillStyle = "rgba(0, 255, 204, 0.95)";
  ctx.font = "bold 12px monospace";
  ctx.textAlign = "left";
  ctx.fillText("Ennemis", left, top);
  top += lineHeight + 4;

  const keys: (keyof GameParams["enemies"])[] = ["base", "rapid", "boss"];
  for (const key of keys) {
    const config = params.enemies[key];
    if (!config) continue;
    ctx.fillStyle = key === "boss" ? NEON.enemyBoss : key === "rapid" ? NEON.enemyRapid : NEON.enemyBase;
    ctx.font = "11px monospace";
    ctx.fillText(ENEMY_TYPE_LABELS[key], left, top);
    top += lineHeight;
    ctx.fillStyle = "rgba(0, 255, 204, 0.85)";
    ctx.font = "10px monospace";
    ctx.fillText(`  PV: ${config.life}  Vit: ${config.speed}  Dég: ${config.damage}  Taille: ${config.size}  Nb/vague: ${config.countPerWave}`, left, top);
    top += lineHeight + 2;
  }

  ctx.restore();
}
