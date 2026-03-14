/**
 * Main menu: Jouer, Partie personnalisée, Charger un replay, Paramètres.
 * Détecte ?config= en URL et propose de lancer la configuration partagée (§6.2).
 */
import { Link, useNavigate } from "react-router-dom";
import { useI18n } from "../i18n/context";
import { getSharedConfigFromUrl, clearSharedConfigFromUrl } from "../shareConfig";
import { useState, useEffect } from "react";

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
  fontSize: "clamp(28px, 5vw, 42px)",
  fontWeight: "bold",
  marginBottom: "16px",
  textShadow: "0 0 20px rgba(0, 255, 204, 0.5)",
};

const linkStyles: React.CSSProperties = {
  padding: "14px 32px",
  fontSize: "clamp(16px, 2.5vw, 18px)",
  fontWeight: 600,
  color: "#00ffcc",
  background: "rgba(0, 255, 204, 0.1)",
  border: "2px solid #00ffcc",
  borderRadius: "8px",
  textDecoration: "none",
  transition: "background 0.15s, box-shadow 0.15s",
};

const bannerStyles: React.CSSProperties = {
  padding: "12px 20px",
  marginBottom: "16px",
  background: "rgba(0, 255, 204, 0.12)",
  border: "1px solid rgba(0, 255, 204, 0.4)",
  borderRadius: "8px",
  display: "flex",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap",
};

export function MenuPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [sharedConfig, setSharedConfig] = useState<Record<string, unknown> | null>(() =>
    getSharedConfigFromUrl()
  );

  useEffect(() => {
    if (sharedConfig) return;
    setSharedConfig(getSharedConfigFromUrl());
  }, [sharedConfig]);

  const launchSharedConfig = () => {
    if (!sharedConfig) return;
    clearSharedConfigFromUrl();
    setSharedConfig(null);
    navigate("/play", { state: { paramsOverrides: sharedConfig } });
  };

  return (
    <div style={menuStyles}>
      <h1 style={titleStyles}>{t("menu.title")}</h1>
      {sharedConfig && (
        <div style={bannerStyles}>
          <span>{t("replay.sharedConfigPrompt")}</span>
          <button
            type="button"
            style={{
              ...linkStyles,
              border: "2px solid #00ffcc",
              cursor: "pointer",
            }}
            onClick={launchSharedConfig}
          >
            {t("replay.launchSharedConfig")}
          </button>
        </div>
      )}
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
