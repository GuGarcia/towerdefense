/**
 * Liste des parties enregistrées : Charger (replay) et Partager (lien config + export fichier).
 * ROADMAP_V4_MENU §5.3, §6.1
 */
import { Link, useNavigate } from "react-router-dom";
import { useI18n } from "../i18n/context";
import { getReplays, deleteReplay, type SavedReplayEntry } from "../replayList";
import { buildShareConfigUrl } from "../shareConfig";
import { useState, useCallback } from "react";

const pageStyles: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "24px",
  gap: "24px",
  background: "#0a0a0f",
  color: "#00ffcc",
  fontFamily: "monospace",
  boxSizing: "border-box",
};

const listStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  width: "100%",
  maxWidth: "560px",
};

const rowStyles: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px",
  padding: "12px 16px",
  background: "rgba(0, 255, 204, 0.06)",
  border: "1px solid rgba(0, 255, 204, 0.2)",
  borderRadius: "8px",
};

const btnStyles: React.CSSProperties = {
  padding: "6px 12px",
  fontSize: "12px",
  color: "#00ffcc",
  background: "rgba(0, 255, 204, 0.1)",
  border: "1px solid #00ffcc",
  borderRadius: "6px",
  cursor: "pointer",
  fontFamily: "monospace",
};

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formatTime(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return min > 0 ? `${min} min ${s} s` : `${s} s`;
}

export function ReplayPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [replays, setReplays] = useState<SavedReplayEntry[]>(() => getReplays());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleLoad = useCallback(
    (entry: SavedReplayEntry) => {
      navigate("/play", { state: { loadReplayId: entry.id } });
    },
    [navigate]
  );

  const handleShare = useCallback(
    (entry: SavedReplayEntry) => {
      const url = buildShareConfigUrl(entry.recording.params as unknown as Record<string, unknown>);
      void navigator.clipboard.writeText(url).then(() => {
        setCopiedId(entry.id);
        setTimeout(() => setCopiedId(null), 2000);
      });
    },
    []
  );

  const handleExportFile = useCallback((entry: SavedReplayEntry) => {
    const blob = new Blob([JSON.stringify(entry.recording, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `replay-${entry.seed}-${entry.savedAt}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, []);

  const handleDelete = useCallback((id: string) => {
    deleteReplay(id);
    setReplays(getReplays());
  }, []);

  return (
    <div style={pageStyles}>
      <h1 style={{ fontSize: "28px" }}>{t("replay.title")}</h1>
      {replays.length === 0 ? (
        <p style={{ color: "rgba(0, 255, 204, 0.8)" }}>{t("replay.noReplays")}</p>
      ) : (
        <div style={listStyles}>
          {replays.map((entry) => (
            <div key={entry.id} style={rowStyles}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ opacity: 0.9 }}>
                  {t("replay.date")}: {formatDate(entry.savedAt)} · {t("replay.seed")}: {entry.seed}
                </span>
                <span style={{ fontSize: "12px", opacity: 0.8 }}>
                  {t("replay.wave")} {entry.summary.wave} · {t("replay.time")}{" "}
                  {formatTime(entry.summary.timeSeconds)} · {t("replay.enemiesKilled")}{" "}
                  {entry.summary.enemiesKilled}
                </span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
                <button type="button" style={btnStyles} onClick={() => handleLoad(entry)}>
                  {t("replay.load")}
                </button>
                <button type="button" style={btnStyles} onClick={() => handleShare(entry)}>
                  {copiedId === entry.id ? t("replay.shareLinkCopied") : t("replay.share")}
                </button>
                <button type="button" style={btnStyles} onClick={() => handleExportFile(entry)}>
                  {t("pause.export")}
                </button>
                <button type="button" style={btnStyles} onClick={() => handleDelete(entry.id)}>
                  {t("replay.delete")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Link
        to="/"
        style={{
          color: "#00ffcc",
          padding: "8px 16px",
          border: "1px solid #00ffcc",
          borderRadius: "6px",
        }}
      >
        {t("common.backToMenu")}
      </Link>
    </div>
  );
}
