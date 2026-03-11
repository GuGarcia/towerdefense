/**
 * Draws game state on a canvas (background, player pentagon, enemies, projectiles). Neon/synthwave style.
 */
import type { Game } from "../../domain/game/Game";
import type { Enemy } from "../../domain/enemy/Enemy";
import type { Projectile } from "../../domain/projectile/Projectile";

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

    for (const e of game.enemies) drawEnemy(ctx, e);
    for (const p of game.projectiles) drawProjectile(ctx, p);
    drawPentagon(ctx, 40);

    ctx.restore();
  };
}
