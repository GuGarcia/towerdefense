/**
 * Game view: renders the player DOM (canvas, overlay, upgrade bars) and runs the game loop.
 * One bar: Pause (left), speed 1x/2x/3x (right). Export and Load replay in pause menu.
 */
import type { GameRecording } from "../../player/infrastructure/replay/GameRecording";
import type { RunPlayerControls, InfoPanelData } from "../../player";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { runPlayer } from "../../player";
import { useI18n } from "../i18n/context";
import { saveReplay, getReplayById } from "../replayList";
import { addCoins, getStoredMeta, getDifficultyPercent } from "../metaStorage";

const containerStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  width: "100%",
  height: "100%",
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

type PlayLocationState =
  | { paramsOverrides?: Record<string, unknown>; loadReplayId?: string }
  | undefined;

export function PlayPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();
  const controlsRef = useRef<RunPlayerControls | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [autoMode, setAutoMode] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [meta, setMeta] = useState(() => getStoredMeta());
  const [infoPanelData, setInfoPanelData] = useState<InfoPanelData | null>(null);

  useEffect(() => {
    if (!showInfo || !controlsRef.current) return;
    let rafId: number;
    const tick = () => {
      setInfoPanelData(controlsRef.current?.getInfoPanelData() ?? null);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [showInfo]);

  const state = location.state as PlayLocationState;
  const paramsOverrides = state?.paramsOverrides;
  const loadReplayId = state?.loadReplayId;

  useEffect(() => {
    let cancelled = false;
    runPlayer({
      paramsOverrides,
      onBackToMenu: () => navigate("/"),
      onRunEnd: (coinsEarned) => {
        void addCoins(coinsEarned);
      },
      onSaveReplay: (recording, summary) => saveReplay(recording, summary),
      saveButtonLabel: t("gameOver.save"),
    }).then((controls) => {
      if (cancelled) return;
      controlsRef.current = controls;
      if (loadReplayId) {
        const entry = getReplayById(loadReplayId);
        if (entry) controls.loadReplay(entry.recording);
      }
    });
    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [navigate, paramsOverrides, loadReplayId, t]);

  const openPause = useCallback(() => {
    controlsRef.current?.pause();
    setPaused(true);
    setMeta(getStoredMeta());
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

  useEffect(() => {
    document.body.classList.add("play-page");
    return () => document.body.classList.remove("play-page");
  }, []);

  useEffect(() => {
    const meta = document.querySelector('meta[name="viewport"]');
    if (!meta) return;
    const original = meta.getAttribute("content") ?? "";
    meta.setAttribute("content", "width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no");
    return () => meta.setAttribute("content", original);
  }, []);

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
    <div className="play-page-container" style={containerStyles}>
      <div className="pause-bar" style={pauseBarStyles}>
        <div className="speed-group" style={speedGroupStyles}>
          <button type="button" style={pauseButtonStyles} onClick={openPause}>
            {t("pause.title")}
          </button>
        </div>
        <div className="speed-group" style={speedGroupStyles}>
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
      </div>
      <div id="game-wrapper" style={{ flex: 1, minHeight: 0, position: "relative", display: "flex" }}>
        <canvas id="game" style={{ display: "block", width: "100%", height: "100%" }} width={800} height={600} />
        <button
          type="button"
          className="game-info-btn"
          onClick={() => setShowInfo((prev) => !prev)}
          title={t("game.info")}
          style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            zIndex: 12,
            width: "32px",
            height: "32px",
            minWidth: "32px",
            minHeight: "32px",
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "monospace",
            fontSize: "16px",
            fontWeight: 600,
            color: showInfo ? "rgba(0, 255, 204, 1)" : "rgba(0, 255, 204, 0.85)",
            background: showInfo ? "rgba(0, 255, 204, 0.25)" : "rgba(0, 255, 204, 0.1)",
            border: "1px solid #00ffcc",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          ⓘ
        </button>
        {showInfo && (
          <div
            className="game-info-overlay"
            style={{
              position: "absolute",
              top: "48px",
              right: "8px",
              left: "8px",
              maxWidth: "320px",
              marginLeft: "auto",
              zIndex: 12,
              background: "rgba(15, 15, 24, 0.98)",
              border: "2px solid #00ffcc",
              borderRadius: "8px",
              padding: "16px 20px",
              color: "#00ffcc",
              fontFamily: "monospace",
              fontSize: "14px",
              boxShadow: "0 0 24px rgba(0, 255, 204, 0.3)",
            }}
          >
            <div style={{ marginBottom: "8px", fontWeight: 600 }}>{t("game.info")}</div>
            <div style={{ marginBottom: "12px" }}>
              {t("game.seed")}: {infoPanelData?.seed ?? controlsRef.current?.getSeed() ?? "—"}
            </div>
            {infoPanelData && (
              <div style={{ marginBottom: "12px", fontSize: "12px" }}>
                <div style={{ fontWeight: 600, marginBottom: "6px" }}>
                  {t("game.statsEnemies")} (vague {infoPanelData.waveNumber})
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "4rem 2.5rem 2.5rem 2.5rem 2rem",
                    gap: "2px 8px",
                    alignItems: "baseline",
                  }}
                >
                  <span style={{ opacity: 0.85 }}> </span>
                  <span style={{ opacity: 0.85, textAlign: "center" }}>❤</span>
                  <span style={{ opacity: 0.85, textAlign: "center" }}>⚡</span>
                  <span style={{ opacity: 0.85, textAlign: "center" }}>⚔</span>
                  <span style={{ opacity: 0.85, textAlign: "center" }}>×</span>
                  {(["base", "rapid", "boss"] as const).map((key) => {
                    const s = infoPanelData.stats[key];
                    const label = key === "base" ? "Base" : key === "rapid" ? "Rapide" : "Boss";
                    const color = key === "boss" ? "#ff3366" : key === "rapid" ? "#c44dff" : "#ff6b9d";
                    return (
                      <div key={key} style={{ display: "contents" }}>
                        <span style={{ color }}>{label}</span>
                        <span style={{ opacity: 0.9, textAlign: "center" }}>{Math.round(s.life)}</span>
                        <span style={{ opacity: 0.9, textAlign: "center" }}>{s.speed.toFixed(1)}</span>
                        <span style={{ opacity: 0.9, textAlign: "center" }}>{Math.round(s.damage)}</span>
                        <span style={{ opacity: 0.9, textAlign: "center" }}>{s.count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
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
        <div className="pause-overlay" style={pauseOverlayStyles}>
          <h2 style={{ marginBottom: "8px" }}>— {t("pause.title")} —</h2>
          <div style={{ marginBottom: "8px", fontSize: "12px", opacity: 0.9 }}>
            Coins meta: <strong>{meta.coins}</strong>
          </div>
          <div style={{ marginBottom: "8px", fontSize: "12px", opacity: 0.9 }}>
            Life lvl: <strong>{meta.lifeLevel}</strong> · Dmg lvl: <strong>{meta.damageLevel}</strong>
          </div>
          <div style={{ marginBottom: "8px", fontSize: "12px", opacity: 0.9 }}>
            Coin/wave: <strong>{meta.coinPerWaveBase}</strong> × <strong>{meta.coinPerWavePercent}%</strong> · Coin/boss:{" "}
            <strong>{meta.coinPerBossBase}</strong>
          </div>
          <div style={{ marginBottom: "8px", fontSize: "12px", opacity: 0.9 }}>
            Difficulté: <strong>{getDifficultyPercent(meta)}%</strong>
          </div>
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
          <button
            type="button"
            style={pauseButtonStyles}
            onClick={() => {
              const controls = controlsRef.current;
              const isOver = controls?.isGameOver?.() ?? false;
              if (!isOver) {
                const coinsEarned = controls?.getCoinsEarned?.() ?? 0;
                void addCoins(coinsEarned);
              }
              navigate("/");
            }}
          >
            {t("pause.quit")}
          </button>
        </div>
      )}
    </div>
  );
}
