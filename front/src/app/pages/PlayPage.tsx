/**
 * Game view: renders the player DOM (canvas, overlay, upgrade bars) and runs the game loop.
 * One bar: Pause (left), speed 1x/2x/3x (right). Export and Load replay in pause menu.
 */
import type { GameRecording } from "../../player/infrastructure/replay/GameRecording";
import type { RunPlayerControls } from "../../player";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { runPlayer } from "../../player";
import { useI18n } from "../i18n/context";

const containerStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  width: "100%",
  height: "100vh",
  overflow: "hidden",
  background: "#0a0a0f",
};

const pauseBarStyles: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "4px 8px",
  background: "#0f0f18",
  borderBottom: "1px solid rgba(0, 255, 204, 0.2)",
};

const speedGroupStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "4px",
};

const pauseOverlayStyles: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 20,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "20px",
  background: "rgba(0, 0, 0, 0.8)",
  color: "#00ffcc",
  fontFamily: "monospace",
};

const pauseButtonStyles: React.CSSProperties = {
  padding: "12px 24px",
  fontSize: "16px",
  fontWeight: 600,
  color: "#00ffcc",
  background: "rgba(0, 255, 204, 0.1)",
  border: "2px solid #00ffcc",
  borderRadius: "8px",
  cursor: "pointer",
};

const speedBtnStyles = (active: boolean): React.CSSProperties => ({
  padding: "6px 12px",
  fontSize: "12px",
  fontFamily: "monospace",
  color: "#00ffcc",
  background: active ? "rgba(0, 255, 204, 0.25)" : "rgba(0, 255, 204, 0.1)",
  border: "1px solid #00ffcc",
  borderRadius: "4px",
  cursor: "pointer",
});

const SPEED_VALUES = [1, 2, 3] as const;

type PlayLocationState = { paramsOverrides?: Record<string, unknown> } | undefined;

export function PlayPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();
  const controlsRef = useRef<RunPlayerControls | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [autoMode, setAutoMode] = useState(false);

  const paramsOverrides = (location.state as PlayLocationState)?.paramsOverrides;

  useEffect(() => {
    let cancelled = false;
    runPlayer({
      paramsOverrides,
      onBackToMenu: () => navigate("/"),
    }).then((controls) => {
      if (!cancelled) controlsRef.current = controls;
    });
    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [navigate, paramsOverrides]);

  const openPause = useCallback(() => {
    controlsRef.current?.pause();
    setPaused(true);
  }, []);

  const closePause = useCallback(() => {
    controlsRef.current?.resume();
    setPaused(false);
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (paused) {
          closePause();
        } else {
          openPause();
        }
      }
    },
    [paused, openPause, closePause]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleExport = useCallback(() => {
    controlsRef.current?.exportRecording();
  }, []);

  const handleLoadReplay = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const raw = reader.result as string;
          const recording = JSON.parse(raw) as GameRecording;
          if (
            typeof recording.seed !== "number" ||
            !recording.params ||
            !Array.isArray(recording.inputs)
          ) {
            alert("Fichier replay invalide.");
            return;
          }
          controlsRef.current?.loadReplay(recording);
          closePause();
        } catch {
          alert("Erreur lors du chargement du replay.");
        }
        e.target.value = "";
      };
      reader.readAsText(file);
    },
    [closePause]
  );

  return (
    <div style={containerStyles}>
      <div style={pauseBarStyles}>
        <div style={speedGroupStyles}>
          <button type="button" style={pauseButtonStyles} onClick={openPause}>
            {t("pause.title")}
          </button>
          <button
            type="button"
            style={speedBtnStyles(autoMode)}
            onClick={() => {
              setAutoMode((prev) => {
                const next = !prev;
                controlsRef.current?.setAutoMode(next);
                return next;
              });
            }}
          >
            {t("pause.auto")}
          </button>
        </div>
        <div style={speedGroupStyles}>
          <span style={{ fontSize: "12px", marginRight: "4px", color: "rgba(0,255,204,0.9)" }}>
            {t("pause.speed")}:
          </span>
          {SPEED_VALUES.map((s) => (
            <button
              key={s}
              type="button"
              style={speedBtnStyles(speed === s)}
              onClick={() => {
                setSpeed(s);
                controlsRef.current?.setSpeedMultiplier(s);
              }}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
      <div id="game-wrapper" style={{ flex: 1, minHeight: 0, position: "relative", display: "flex" }}>
        <canvas id="game" style={{ display: "block", width: "100%", height: "100%" }} width={800} height={600} />
        <div
          id="game-overlay"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
            zIndex: 10,
            display: "none",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "24px",
            background: "rgba(0,0,0,0.6)",
          }}
        >
          <span className="game-over-title">GAME OVER</span>
          <span className="game-over-stats" />
          <button type="button" className="btn-replay-overlay">
            Rejouer
          </button>
        </div>
      </div>
      <div id="upgrade-bars" />

      {paused && (
        <div style={pauseOverlayStyles}>
          <h2 style={{ marginBottom: "8px" }}>— {t("pause.title")} —</h2>
          <button type="button" style={pauseButtonStyles} onClick={closePause}>
            {t("pause.resume")}
          </button>
          <button type="button" style={pauseButtonStyles} onClick={handleExport}>
            {t("pause.export")}
          </button>
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            <button type="button" style={pauseButtonStyles} onClick={handleLoadReplay}>
              {t("pause.loadReplay")}
            </button>
          </>
          <button type="button" style={pauseButtonStyles} onClick={() => { closePause(); navigate("/settings"); }}>
            {t("pause.settings")}
          </button>
          <button type="button" style={pauseButtonStyles} onClick={() => navigate("/")}>
            {t("pause.quit")}
          </button>
        </div>
      )}
    </div>
  );
}
