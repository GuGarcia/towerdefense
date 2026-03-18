/**
 * Main menu: Jouer, Partie personnalisée, Charger un replay, Paramètres.
 * Détecte ?config= en URL et propose de lancer la configuration partagée (§6.2).
 */
import { Link, useNavigate } from "react-router-dom";
import { useI18n } from "../i18n/context";
import { getSharedConfigFromUrl, clearSharedConfigFromUrl } from "../shareConfig";
import { useState, useEffect } from "react";
import {
  getStoredMeta,
  buyLifeUpgrade,
  buyDamageUpgrade,
  buyCoinWaveBaseUpgrade,
  buyCoinWavePercentUpgrade,
  buyCoinBossBaseUpgrade,
  buyDifficultyUpgrade,
  getNextLifeUpgradeCost,
  getNextDamageUpgradeCost,
  getNextCoinWaveBaseUpgradeCost,
  getNextCoinWavePercentUpgradeCost,
  getNextCoinBossBaseUpgradeCost,
  getNextDifficultyUpgradeCost,
  isCoinWaveBaseUnlocked,
  isCoinWavePercentUnlocked,
  isCoinBossUnlocked,
  LIFE_DELTA_PER_LEVEL,
  DAMAGE_DELTA_PER_LEVEL,
  COIN_WAVE_BASE_DELTA_PER_LEVEL,
  COIN_WAVE_PERCENT_DELTA_PER_LEVEL,
  COIN_BOSS_BASE_DELTA_PER_LEVEL,
  getDifficultyPercent,
  DIFFICULTY_PERCENT_DELTA_PER_LEVEL,
} from "../metaStorage";

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
  const [meta, setMeta] = useState(() => getStoredMeta());

  useEffect(() => {
    if (sharedConfig) return;
    setSharedConfig(getSharedConfigFromUrl());
  }, [sharedConfig]);

  const refreshMeta = () => setMeta(getStoredMeta());

  const launchSharedConfig = () => {
    if (!sharedConfig) return;
    clearSharedConfigFromUrl();
    setSharedConfig(null);
    navigate("/play", { state: { paramsOverrides: sharedConfig } });
  };

  return (
    <div style={menuStyles}>
      <h1 style={titleStyles}>{t("menu.title")}</h1>
      <div style={bannerStyles}>
        <span>
          Coins meta : <strong>{meta.coins}</strong>
        </span>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            style={{ ...linkStyles, cursor: meta.coins >= getNextLifeUpgradeCost(meta) ? "pointer" : "not-allowed", opacity: meta.coins >= getNextLifeUpgradeCost(meta) ? 1 : 0.6 }}
            disabled={meta.coins < getNextLifeUpgradeCost(meta)}
            onClick={() => {
              buyLifeUpgrade();
              refreshMeta();
            }}
          >
            Life +{LIFE_DELTA_PER_LEVEL} (lvl {meta.lifeLevel}) - coût {getNextLifeUpgradeCost(meta)}
          </button>
          <button
            type="button"
            style={{ ...linkStyles, cursor: meta.coins >= getNextDamageUpgradeCost(meta) ? "pointer" : "not-allowed", opacity: meta.coins >= getNextDamageUpgradeCost(meta) ? 1 : 0.6 }}
            disabled={meta.coins < getNextDamageUpgradeCost(meta)}
            onClick={() => {
              buyDamageUpgrade();
              refreshMeta();
            }}
          >
            Dmg +{DAMAGE_DELTA_PER_LEVEL} (lvl {meta.damageLevel}) - coût {getNextDamageUpgradeCost(meta)}
          </button>
          <button
            type="button"
            style={{
              ...linkStyles,
              cursor:
                isCoinWaveBaseUnlocked(meta) && meta.coins >= getNextCoinWaveBaseUpgradeCost(meta) ? "pointer" : "not-allowed",
              opacity:
                isCoinWaveBaseUnlocked(meta) && meta.coins >= getNextCoinWaveBaseUpgradeCost(meta) ? 1 : 0.6,
            }}
            disabled={!isCoinWaveBaseUnlocked(meta) || meta.coins < getNextCoinWaveBaseUpgradeCost(meta)}
            onClick={() => {
              buyCoinWaveBaseUpgrade();
              refreshMeta();
            }}
          >
            Coin/wave +{COIN_WAVE_BASE_DELTA_PER_LEVEL} (base {meta.coinPerWaveBase}) - coût {getNextCoinWaveBaseUpgradeCost(meta)}
          </button>
          <button
            type="button"
            style={{
              ...linkStyles,
              cursor:
                isCoinWavePercentUnlocked(meta) && meta.coins >= getNextCoinWavePercentUpgradeCost(meta)
                  ? "pointer"
                  : "not-allowed",
              opacity:
                isCoinWavePercentUnlocked(meta) && meta.coins >= getNextCoinWavePercentUpgradeCost(meta) ? 1 : 0.6,
            }}
            disabled={!isCoinWavePercentUnlocked(meta) || meta.coins < getNextCoinWavePercentUpgradeCost(meta)}
            onClick={() => {
              buyCoinWavePercentUpgrade();
              refreshMeta();
            }}
          >
            % coin/wave +{COIN_WAVE_PERCENT_DELTA_PER_LEVEL}% (pct {meta.coinPerWavePercent}%) - coût {getNextCoinWavePercentUpgradeCost(meta)}
          </button>
          <button
            type="button"
            style={{
              ...linkStyles,
              cursor:
                isCoinBossUnlocked(meta) && meta.coins >= getNextCoinBossBaseUpgradeCost(meta) ? "pointer" : "not-allowed",
              opacity:
                isCoinBossUnlocked(meta) && meta.coins >= getNextCoinBossBaseUpgradeCost(meta) ? 1 : 0.6,
            }}
            disabled={!isCoinBossUnlocked(meta) || meta.coins < getNextCoinBossBaseUpgradeCost(meta)}
            onClick={() => {
              buyCoinBossBaseUpgrade();
              refreshMeta();
            }}
          >
            Coin/boss +{COIN_BOSS_BASE_DELTA_PER_LEVEL} (base {meta.coinPerBossBase}) - coût {getNextCoinBossBaseUpgradeCost(meta)}
          </button>
          <button
            type="button"
            style={{ ...linkStyles, cursor: meta.coins >= getNextDifficultyUpgradeCost(meta) ? "pointer" : "not-allowed", opacity: meta.coins >= getNextDifficultyUpgradeCost(meta) ? 1 : 0.6 }}
            disabled={meta.coins < getNextDifficultyUpgradeCost(meta)}
            onClick={() => {
              buyDifficultyUpgrade();
              refreshMeta();
            }}
          >
            Difficulté +{DIFFICULTY_PERCENT_DELTA_PER_LEVEL}% (actuel {getDifficultyPercent(meta)}%) - coût {getNextDifficultyUpgradeCost(meta)}
          </button>
        </div>
      </div>
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
