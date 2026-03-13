/**
 * Ensures game-over overlay exists and wires replay button.
 */
export interface SetupGameOverlayOptions {
  onReplayClick: () => void;
}

export function setupGameOverlay(
  canvas: HTMLCanvasElement,
  overlayEl: HTMLElement | null,
  options: SetupGameOverlayOptions
): HTMLElement {
  const { onReplayClick } = options;
  let gameWrapperEl = document.getElementById("game-wrapper");
  let gameOverlayEl = overlayEl ?? document.getElementById("game-overlay");

  if (!gameWrapperEl && canvas.parentElement) {
    gameWrapperEl = document.createElement("div");
    gameWrapperEl.id = "game-wrapper";
    gameWrapperEl.className = "game-wrapper";
    canvas.parentElement.insertBefore(gameWrapperEl, canvas);
    gameWrapperEl.appendChild(canvas);
  }

  if (!gameOverlayEl && gameWrapperEl) {
    gameOverlayEl = document.createElement("div");
    gameOverlayEl.id = "game-overlay";
    gameOverlayEl.className = "game-overlay";
    const title = document.createElement("span");
    title.className = "game-over-title";
    title.textContent = "GAME OVER";
    const statsEl = document.createElement("span");
    statsEl.className = "game-over-stats";
    const replayBtn = document.createElement("button");
    replayBtn.type = "button";
    replayBtn.className = "btn-replay-overlay";
    replayBtn.textContent = "Rejouer";
    gameOverlayEl.appendChild(title);
    gameOverlayEl.appendChild(statsEl);
    gameOverlayEl.appendChild(replayBtn);
    gameWrapperEl.appendChild(gameOverlayEl);
  }

  const replayOverlayBtn = gameOverlayEl?.querySelector<HTMLButtonElement>(".btn-replay-overlay");
  if (replayOverlayBtn) {
    replayOverlayBtn.addEventListener("click", onReplayClick);
  }

  if (gameOverlayEl) {
    gameOverlayEl.style.display = "none";
    gameOverlayEl.classList.remove("visible");
  }

  return gameOverlayEl ?? document.createElement("div");
}
