/**
 * Builds replay toolbar UI: speed controls, export, load replay.
 */
import type { GameRecording } from "../replay/GameRecording";

export interface SetupReplayToolbarOptions {
  setSpeedMultiplier: (n: number) => void;
  onExport: () => void;
  onLoadReplay: (recording: GameRecording) => void;
}

export function setupReplayToolbar(toolbarEl: HTMLElement, options: SetupReplayToolbarOptions): void {
  const { setSpeedMultiplier, onExport, onLoadReplay } = options;
  const speedValues = [1, 2, 3] as const;

  const speedContainer = document.createElement("div");
  speedContainer.className = "replay-speed-container";
  const speedLabel = document.createElement("span");
  speedLabel.className = "replay-speed-label";
  speedLabel.textContent = "Vitesse:";
  speedContainer.appendChild(speedLabel);

  speedValues.forEach((speed) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "replay-speed-btn";
    btn.textContent = `${speed}x`;
    if (speed === 1) btn.classList.add("active");
    btn.addEventListener("click", () => {
      setSpeedMultiplier(speed);
      speedContainer.querySelectorAll(".replay-speed-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
    speedContainer.appendChild(btn);
  });
  toolbarEl.appendChild(speedContainer);

  const btnExport = document.createElement("button");
  btnExport.type = "button";
  btnExport.className = "replay-export-btn";
  btnExport.textContent = "Exporter";
  btnExport.addEventListener("click", onExport);
  toolbarEl.appendChild(btnExport);

  const labelReplay = document.createElement("label");
  labelReplay.className = "replay-load-label";
  labelReplay.textContent = "Charger un replay";
  const inputReplay = document.createElement("input");
  inputReplay.type = "file";
  inputReplay.accept = ".json";
  inputReplay.id = "input-replay";
  inputReplay.className = "replay-file-input";
  labelReplay.htmlFor = inputReplay.id;
  toolbarEl.appendChild(labelReplay);
  toolbarEl.appendChild(inputReplay);

  inputReplay.addEventListener("change", () => {
    const file = inputReplay.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const raw = reader.result as string;
        const recording = JSON.parse(raw) as GameRecording;
        if (typeof recording.seed !== "number" || !recording.params || !Array.isArray(recording.inputs)) {
          alert("Fichier replay invalide.");
          return;
        }
        onLoadReplay(recording);
        inputReplay.value = "";
      } catch {
        alert("Erreur lors du chargement du replay.");
      }
    };
    reader.readAsText(file);
  });
}
