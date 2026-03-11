/**
 * Entry point — validates the Canvas 2D pipeline.
 * Phase 0: draws a circle to verify rendering works.
 */
function main(): void {
  const canvas = document.getElementById("game") as HTMLCanvasElement | null;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const canvasEl = canvas;
  const ctx2 = ctx;
  function resize(): void {
    canvasEl.width = window.innerWidth;
    canvasEl.height = window.innerHeight;
    draw(ctx2, canvasEl.width, canvasEl.height);
  }

  window.addEventListener("resize", resize);
  resize();
}

function draw(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const cx = width / 2;
  const cy = height / 2;

  ctx.fillStyle = "#0a0a0f";
  ctx.fillRect(0, 0, width, height);

  ctx.beginPath();
  ctx.arc(cx, cy, 40, 0, Math.PI * 2);
  ctx.fillStyle = "#1a1a2e";
  ctx.fill();
  ctx.strokeStyle = "#00ffcc";
  ctx.lineWidth = 2;
  ctx.stroke();
}

main();
