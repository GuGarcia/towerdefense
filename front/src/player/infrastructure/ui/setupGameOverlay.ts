/**
 * Ensures game-over overlay exists and wires replay + back-to-menu buttons.
 */
export interface SetupGameOverlayOptions {
  onReplayClick: () => void;
  /** When provided, a "Retour au menu" button is shown and calls this. */
  onBackToMenu?: () => void;
}

export function setupGameOverlay(
  canvas: HTMLCanvasElement,
  overlayEl: HTMLElement | null,
  options: SetupGameOverlayOptions
): HTMLElement {
  const { onReplayClick, onBackToMenu } = options;
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
    if (onBackToMenu) {
      const backBtn = document.createElement("button");
      backBtn.type = "button";
      backBtn.className = "btn-back-overlay";
      backBtn.textContent = "Retour au menu";
      gameOverlayEl.appendChild(backBtn);
    }
    gameWrapperEl.appendChild(gameOverlayEl);
  }

  const replayOverlayBtn = gameOverlayEl?.querySelector<HTMLButtonElement>(".btn-replay-overlay");
  if (replayOverlayBtn) {
    replayOverlayBtn.addEventListener("click", onReplayClick);
  }
  if (gameOverlayEl && onBackToMenu) {
    let backBtn = gameOverlayEl.querySelector<HTMLButtonElement>(".btn-back-overlay");
    if (!backBtn) {
      backBtn = document.createElement("button");
      backBtn.type = "button";
      backBtn.className = "btn-back-overlay";
      backBtn.textContent = "Retour au menu";
      gameOverlayEl.appendChild(backBtn);
    }
    backBtn.addEventListener("click", onBackToMenu);
  }

  if (gameOverlayEl) {
    gameOverlayEl.style.display = "none";
    gameOverlayEl.classList.remove("visible");
  }

  return gameOverlayEl ?? document.createElement("div");
}
