/**
 * Placeholder: Liste des parties enregistrées (ROADMAP_V4_MENU §5).
 */
import { Link } from "react-router-dom";
import { useI18n } from "../i18n/context";

const pageStyles: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "24px",
  background: "#0a0a0f",
  color: "#00ffcc",
  fontFamily: "monospace",
};

export function ReplayPage() {
  const { t } = useI18n();
  return (
    <div style={pageStyles}>
      <h1 style={{ fontSize: "28px" }}>{t("replay.title")}</h1>
      <p style={{ color: "rgba(0, 255, 204, 0.8)" }}>{t("replay.placeholder")}</p>
      <Link to="/" style={{ color: "#00ffcc", padding: "8px 16px", border: "1px solid #00ffcc", borderRadius: "6px" }}>
        {t("common.backToMenu")}
      </Link>
    </div>
  );
}
