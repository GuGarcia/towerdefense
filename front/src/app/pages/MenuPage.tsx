/**
 * Main menu: Jouer, Partie personnalisée, Charger un replay, Paramètres.
 */
import { Link } from "react-router-dom";
import { useI18n } from "../i18n/context";

const menuStyles: React.CSSProperties = {
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

const titleStyles: React.CSSProperties = {
  fontSize: "42px",
  fontWeight: "bold",
  marginBottom: "16px",
  textShadow: "0 0 20px rgba(0, 255, 204, 0.5)",
};

const linkStyles: React.CSSProperties = {
  padding: "14px 32px",
  fontSize: "18px",
  fontWeight: 600,
  color: "#00ffcc",
  background: "rgba(0, 255, 204, 0.1)",
  border: "2px solid #00ffcc",
  borderRadius: "8px",
  textDecoration: "none",
  transition: "background 0.15s, box-shadow 0.15s",
};

export function MenuPage() {
  const { t } = useI18n();
  return (
    <div style={menuStyles}>
      <h1 style={titleStyles}>{t("menu.title")}</h1>
      <nav style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <Link to="/play" style={linkStyles}>
          {t("menu.play")}
        </Link>
        <Link to="/custom" style={linkStyles}>
          {t("menu.customGame")}
        </Link>
        <Link to="/replay" style={linkStyles}>
          {t("menu.loadReplay")}
        </Link>
        <Link to="/settings" style={linkStyles}>
          {t("menu.settings")}
        </Link>
      </nav>
    </div>
  );
}
