/**
 * Draws game state on a canvas (background, player pentagon, enemies, projectiles). Neon/synthwave style.
 */
import type { Game } from "../../domain/game/Game";
import type { Enemy } from "../../domain/enemy/Enemy";
import type { Projectile } from "../../domain/projectile/Projectile";
import { GameState } from "../../domain/game/GameState";

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

export function createCanvasRenderer(
  canvas: HTMLCanvasElement,
  getScale: () => number
): (game: Game) => void {
  return function render(game: Game): void {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const scale = getScale();

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = NEON.bg;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    for (const e of game.enemies) drawEnemy(ctx, e);
    for (const p of game.projectiles) drawProjectile(ctx, p);
    drawPentagon(ctx, 40);

    ctx.restore();

    ctx.fillStyle = "#00ffcc";
    ctx.font = "16px monospace";
    ctx.fillText(`Life ${Math.ceil(game.player.life)} / ${game.player.maxLife}`, 12, 24);
    ctx.fillText(`Money ${game.money}`, 12, 44);
    ctx.fillStyle = "rgba(0, 255, 204, 0.6)";
    ctx.font = "12px monospace";
    ctx.fillText("1: dmg 2: life 3: regen 4: speed", 12, h - 12);
    if (game.state === GameState.GameOver) {
      ctx.fillStyle = "#ff3366";
      ctx.font = "bold 32px monospace";
      ctx.fillText("GAME OVER", cx - 80, cy);
    }
  };
}
