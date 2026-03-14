/**
 * Ensures game-over overlay exists and wires replay + back-to-menu + save buttons.
 */
export interface SaveReplayPayload {
  recording: import("../../infrastructure/replay/GameRecording").GameRecording;
  summary: { wave: number; timeSeconds: number; enemiesKilled: number };
}

export interface SetupGameOverlayOptions {
  onReplayClick: () => void;
  /** When provided, a "Retour au menu" button is shown and calls this. */
  onBackToMenu?: () => void;
  /** When both provided, a "Sauvegarder" button is shown; on click, getPayload() is called and onSaveReplay with the result. */
  getSaveReplayPayload?: () => SaveReplayPayload | null;
  onSaveReplay?: (recording: SaveReplayPayload["recording"], summary: SaveReplayPayload["summary"]) => void;
  /** Label for the save button (e.g. "Sauvegarder"). */
  saveButtonLabel?: string;
}

export function setupGameOverlay(
  canvas: HTMLCanvasElement,
  overlayEl: HTMLElement | null,
  options: SetupGameOverlayOptions
): HTMLElement {
  const { onReplayClick, onBackToMenu, getSaveReplayPayload, onSaveReplay, saveButtonLabel = "Sauvegarder" } = options;
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
    if (getSaveReplayPayload && onSaveReplay) {
      const saveBtn = document.createElement("button");
      saveBtn.type = "button";
      saveBtn.className = "btn-save-overlay";
      saveBtn.textContent = saveButtonLabel;
      gameOverlayEl.appendChild(saveBtn);
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
  if (gameOverlayEl && getSaveReplayPayload && onSaveReplay) {
    let saveBtn = gameOverlayEl.querySelector<HTMLButtonElement>(".btn-save-overlay");
    if (!saveBtn) {
      saveBtn = document.createElement("button");
      saveBtn.type = "button";
      saveBtn.className = "btn-save-overlay";
      saveBtn.textContent = saveButtonLabel;
      gameOverlayEl.appendChild(saveBtn);
    }
    saveBtn.addEventListener("click", () => {
      const payload = getSaveReplayPayload();
      if (payload) onSaveReplay(payload.recording, payload.summary);
    });
  }

  if (gameOverlayEl) {
    gameOverlayEl.style.display = "none";
    gameOverlayEl.classList.remove("visible");
  }

  return gameOverlayEl ?? document.createElement("div");
}
