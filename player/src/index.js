/**
 * Point d'entrée — valide le pipeline Canvas 2D.
 * Phase 0 : affiche un cercle pour vérifier que le rendu fonctionne.
 */
function main() {
  const canvas = document.getElementById('game');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Redimensionner le canvas pour remplir la fenêtre (tout en gardant une zone de jeu cohérente)
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    draw(ctx, canvas.width, canvas.height);
  }

  window.addEventListener('resize', resize);
  resize();
}

function draw(ctx, width, height) {
  const cx = width / 2;
  const cy = height / 2;

  // Fond sombre
  ctx.fillStyle = '#0a0a0f';
  ctx.fillRect(0, 0, width, height);

  // Cercle au centre (style neon simple)
  ctx.beginPath();
  ctx.arc(cx, cy, 40, 0, Math.PI * 2);
  ctx.fillStyle = '#1a1a2e';
  ctx.fill();
  ctx.strokeStyle = '#00ffcc';
  ctx.lineWidth = 2;
  ctx.stroke();
}

main();
