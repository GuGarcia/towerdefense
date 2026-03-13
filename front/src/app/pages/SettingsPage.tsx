/**
 * Paramètres app — langue (FR/EN), volume placeholder (ROADMAP_V4_MENU §3).
 */
import { Link } from "react-router-dom";
import { useI18n } from "../i18n/context";
import { getStoredSettings, setStoredSettings } from "../i18n/storage";
import type { Locale } from "../i18n/translations";

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

const fieldStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
};

export function SettingsPage() {
  const { t, locale, setLocale } = useI18n();

  const handleLocaleChange = (next: Locale) => {
    setLocale(next);
    setStoredSettings({ language: next });
  };

  const volume = getStoredSettings().volume ?? 100;

  return (
    <div style={pageStyles}>
      <h1 style={{ fontSize: "28px" }}>{t("settings.title")}</h1>

      <div style={fieldStyles}>
        <span>{t("settings.language")}</span>
        <select
          value={locale}
          onChange={(e) => handleLocaleChange(e.target.value as Locale)}
          style={{
            padding: "8px 12px",
            fontFamily: "monospace",
            background: "rgba(0, 255, 204, 0.1)",
            border: "1px solid #00ffcc",
            borderRadius: "6px",
            color: "#00ffcc",
          }}
        >
          <option value="fr">FR</option>
          <option value="en">EN</option>
        </select>
      </div>

      <div style={fieldStyles}>
        <span>{t("settings.volume")}</span>
        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          readOnly
          disabled
          title={t("settings.volumePlaceholder")}
          style={{ opacity: 0.6 }}
        />
        <span style={{ fontSize: "12px", opacity: 0.8 }}>{t("settings.volumePlaceholder")}</span>
      </div>

      <Link to="/" style={{ color: "#00ffcc", padding: "8px 16px", border: "1px solid #00ffcc", borderRadius: "6px" }}>
        {t("common.backToMenu")}
      </Link>
    </div>
  );
}
