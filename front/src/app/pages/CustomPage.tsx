/**
 * Partie personnalisée: formulaire Joueur, Économie, Vagues, Ennemis → paramsOverrides → /play.
 * Sauvegarde / chargement de plusieurs configurations (localStorage).
 */
import { useState, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useI18n } from "../i18n/context";
import { getSavedConfigs, saveConfig, deleteConfig } from "../customConfigs";
import type { GameParams } from "../../player/domain/game/GameParams";

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

const DEFAULT_FORM: CustomFormState = {
  seed: 0,
  player: {
    initialLife: 100,
    initialMaxLife: 100,
    initialDamage: 10,
    initialRegen: 0.1,
    initialAttackSpeed: 2,
    initialRange: 300,
  },
  economy: {
    upgradeCostBase: 10,
    upgradeCostIncrement: 5,
    currencyPerKill: { base: 10, rapid: 5, boss: 100 },
    waveBonusBase: 5,
    waveBonusIncrement: 5,
  },
  wave: {
    wave1DifficultyFactor: 0.6,
    difficultyScaling: { life: 1.1, speed: 1.02, damage: 1.05, count: 1.1 },
    bossEveryNWaves: 10,
  },
  enemies: {
    base: { life: 20, speed: 2, damage: 5, size: 12, countPerWave: 5 },
    rapid: { life: 8, speed: 4, damage: 2, size: 6, countPerWave: 8 },
    boss: { life: 50, speed: 0.8, damage: 25, size: 32, countPerWave: 1 },
  },
};

interface CustomFormState {
  seed: number;
  player: GameParams["player"];
  economy: GameParams["economy"];
  wave: {
    wave1DifficultyFactor: number;
    difficultyScaling: GameParams["wave"]["difficultyScaling"];
    bossEveryNWaves: number;
  };
  enemies: GameParams["enemies"];
}

function buildParamsOverrides(form: CustomFormState): DeepPartial<GameParams> {
  return {
    seed: form.seed,
    player: { ...form.player },
    economy: { ...form.economy },
    wave: {
      wave1DifficultyFactor: form.wave.wave1DifficultyFactor,
      difficultyScaling: { ...form.wave.difficultyScaling },
      bossEveryNWaves: form.wave.bossEveryNWaves,
    },
    enemies: {
      base: { ...form.enemies.base },
      rapid: { ...form.enemies.rapid },
      boss: { ...form.enemies.boss },
    },
  };
}

const pageStyles: React.CSSProperties = {
  minHeight: "100vh",
  height: "100vh",
  overflowY: "auto",
  padding: "24px",
  background: "#0a0a0f",
  color: "#00ffcc",
  fontFamily: "monospace",
  boxSizing: "border-box",
};

const sectionStyles: React.CSSProperties = {
  marginBottom: "24px",
  padding: "12px 16px",
  border: "1px solid rgba(0, 255, 204, 0.3)",
  borderRadius: "8px",
};

const rowStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  marginBottom: "8px",
};

const labelStyles: React.CSSProperties = { minWidth: "180px", fontSize: "13px" };
const inputStyles: React.CSSProperties = {
  padding: "6px 10px",
  fontFamily: "monospace",
  background: "rgba(0, 255, 204, 0.1)",
  border: "1px solid #00ffcc",
  borderRadius: "4px",
  color: "#00ffcc",
};

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div style={rowStyles}>
      <span style={labelStyles}>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ flex: 1, minWidth: "180px", maxWidth: "420px" }}
      />
      <span style={{ minWidth: "48px", fontSize: "13px" }}>{value}</span>
    </div>
  );
}

function NumberInput({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div style={rowStyles}>
      <span style={labelStyles}>{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={inputStyles}
      />
    </div>
  );
}

export function CustomPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [form, setForm] = useState<CustomFormState>(() => ({
    ...DEFAULT_FORM,
    seed: Math.floor(Math.random() * 0x7fffffff),
  }));
  const [configName, setConfigName] = useState("");
  const [savedListVersion, setSavedListVersion] = useState(0);
  const savedConfigs = useMemo(() => getSavedConfigs(), [savedListVersion]);

  const update = useCallback(<K extends keyof CustomFormState>(key: K, value: CustomFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateNested = useCallback(
    <K1 extends keyof CustomFormState, K2 extends keyof CustomFormState[K1]>(
      key1: K1,
      key2: K2,
      value: CustomFormState[K1] extends object ? CustomFormState[K1][K2] : never
    ) => {
      setForm((prev) => ({
        ...prev,
        [key1]: { ...(prev[key1] as object), [key2]: value },
      }));
    },
    []
  );

  const updateDeep = useCallback(
    (
      key1: keyof CustomFormState,
      key2: string,
      key3: string,
      value: number
    ) => {
      setForm((prev) => {
        const outer = prev[key1] as Record<string, unknown>;
        const inner = outer[key2] as Record<string, number>;
        return {
          ...prev,
          [key1]: {
            ...outer,
            [key2]: { ...inner, [key3]: value },
          },
        };
      });
    },
    []
  );

  const handleLaunch = useCallback(() => {
    const overrides = buildParamsOverrides(form);
    navigate("/play", { state: { paramsOverrides: overrides } });
  }, [form, navigate]);

  const randomSeed = useCallback(() => {
    setForm((prev) => ({ ...prev, seed: Math.floor(Math.random() * 0x7fffffff) }));
  }, []);

  const handleSaveConfig = useCallback(() => {
    saveConfig(configName, form);
    setConfigName("");
    setSavedListVersion((v) => v + 1);
  }, [configName, form]);

  const handleLoadConfig = useCallback((savedForm: unknown) => {
    const next = savedForm as CustomFormState;
    if (next && typeof next.seed === "number" && next.player && next.economy && next.wave && next.enemies) {
      setForm({ ...next });
    }
  }, []);

  const handleDeleteConfig = useCallback((id: string) => {
    deleteConfig(id);
    setSavedListVersion((v) => v + 1);
  }, []);

  const handleExportJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(form, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `config-partie-${form.seed}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [form]);

  return (
    <div style={pageStyles}>
      <h1 style={{ marginBottom: "16px", fontSize: "24px" }}>{t("custom.title")}</h1>

      <div style={sectionStyles}>
        <h2 style={{ marginBottom: "12px", fontSize: "16px" }}>{t("custom.myConfigs")}</h2>
        <div style={{ ...rowStyles, flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
          <input
            type="text"
            placeholder={t("custom.configNamePlaceholder")}
            value={configName}
            onChange={(e) => setConfigName(e.target.value)}
            style={{ ...inputStyles, minWidth: "140px" }}
          />
          <button type="button" style={{ ...inputStyles, cursor: "pointer" }} onClick={handleSaveConfig}>
            {t("custom.saveConfig")}
          </button>
          <button type="button" style={{ ...inputStyles, cursor: "pointer" }} onClick={handleExportJson}>
            {t("custom.exportJson")}
          </button>
        </div>
        {savedConfigs.length > 0 && (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {savedConfigs.map((c) => (
              <li key={c.id} style={{ ...rowStyles, marginBottom: "6px" }}>
                <span style={{ flex: 1, fontSize: "13px", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</span>
                <button type="button" style={{ ...inputStyles, cursor: "pointer", padding: "4px 10px" }} onClick={() => handleLoadConfig(c.form)}>
                  {t("custom.loadConfig")}
                </button>
                <button type="button" style={{ ...inputStyles, cursor: "pointer", padding: "4px 10px" }} onClick={() => handleDeleteConfig(c.id)}>
                  {t("custom.deleteConfig")}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div style={sectionStyles}>
        <h2 style={{ marginBottom: "12px", fontSize: "16px" }}>{t("custom.seed")}</h2>
        <div style={rowStyles}>
          <span style={labelStyles}>{t("custom.seed")}</span>
          <input
            type="number"
            value={form.seed}
            onChange={(e) => update("seed", Number(e.target.value))}
            style={inputStyles}
          />
          <button type="button" style={{ ...inputStyles, cursor: "pointer" }} onClick={randomSeed}>
            {t("custom.seedRandom")}
          </button>
        </div>
      </div>

      <div style={sectionStyles}>
        <h2 style={{ marginBottom: "12px", fontSize: "16px" }}>{t("custom.sectionPlayer")}</h2>
        <SliderRow label={t("custom.playerLife")} value={form.player.initialLife} min={20} max={500} step={5} onChange={(v) => updateNested("player", "initialLife", v)} />
        <SliderRow label={t("custom.playerMaxLife")} value={form.player.initialMaxLife} min={20} max={500} step={5} onChange={(v) => updateNested("player", "initialMaxLife", v)} />
        <SliderRow label={t("custom.playerDamage")} value={form.player.initialDamage} min={1} max={80} step={1} onChange={(v) => updateNested("player", "initialDamage", v)} />
        <SliderRow label={t("custom.playerRegen")} value={form.player.initialRegen} min={0} max={2} step={0.05} onChange={(v) => updateNested("player", "initialRegen", v)} />
        <SliderRow label={t("custom.playerAttackSpeed")} value={form.player.initialAttackSpeed} min={0.25} max={10} step={0.25} onChange={(v) => updateNested("player", "initialAttackSpeed", v)} />
        <SliderRow label={t("custom.playerRange")} value={form.player.initialRange ?? 300} min={100} max={800} step={25} onChange={(v) => updateNested("player", "initialRange", v)} />
      </div>

      <div style={sectionStyles}>
        <h2 style={{ marginBottom: "12px", fontSize: "16px" }}>{t("custom.sectionEconomy")}</h2>
        <SliderRow label={t("custom.costBase")} value={form.economy.upgradeCostBase} min={1} max={100} step={1} onChange={(v) => updateNested("economy", "upgradeCostBase", v)} />
        <SliderRow label={t("custom.costIncrement")} value={form.economy.upgradeCostIncrement} min={0} max={50} step={1} onChange={(v) => updateNested("economy", "upgradeCostIncrement", v)} />
        <SliderRow label={t("custom.goldBase")} value={form.economy.currencyPerKill.base} min={1} max={100} step={1} onChange={(v) => updateDeep("economy", "currencyPerKill", "base", v)} />
        <SliderRow label={t("custom.goldRapid")} value={form.economy.currencyPerKill.rapid} min={1} max={50} step={1} onChange={(v) => updateDeep("economy", "currencyPerKill", "rapid", v)} />
        <SliderRow label={t("custom.goldBoss")} value={form.economy.currencyPerKill.boss} min={10} max={500} step={10} onChange={(v) => updateDeep("economy", "currencyPerKill", "boss", v)} />
        <SliderRow label={t("custom.waveBonusBase")} value={form.economy.waveBonusBase} min={0} max={50} step={1} onChange={(v) => updateNested("economy", "waveBonusBase", v)} />
        <SliderRow label={t("custom.waveBonusIncrement")} value={form.economy.waveBonusIncrement} min={0} max={50} step={1} onChange={(v) => updateNested("economy", "waveBonusIncrement", v)} />
      </div>

      <div style={sectionStyles}>
        <h2 style={{ marginBottom: "12px", fontSize: "16px" }}>{t("custom.sectionWaves")}</h2>
        <SliderRow label={t("custom.wave1Factor")} value={form.wave.wave1DifficultyFactor} min={0.1} max={1.5} step={0.1} onChange={(v) => updateNested("wave", "wave1DifficultyFactor", v)} />
        <SliderRow label={t("custom.scalingLife")} value={form.wave.difficultyScaling.life} min={1} max={1.5} step={0.01} onChange={(v) => updateDeep("wave", "difficultyScaling", "life", v)} />
        <SliderRow label={t("custom.scalingSpeed")} value={form.wave.difficultyScaling.speed} min={1} max={1.3} step={0.01} onChange={(v) => updateDeep("wave", "difficultyScaling", "speed", v)} />
        <SliderRow label={t("custom.scalingDamage")} value={form.wave.difficultyScaling.damage} min={1} max={1.5} step={0.01} onChange={(v) => updateDeep("wave", "difficultyScaling", "damage", v)} />
        <SliderRow label={t("custom.scalingCount")} value={form.wave.difficultyScaling.count} min={1} max={1.6} step={0.01} onChange={(v) => updateDeep("wave", "difficultyScaling", "count", v)} />
        <NumberInput label={t("custom.bossEvery")} value={form.wave.bossEveryNWaves} min={1} max={30} onChange={(v) => updateNested("wave", "bossEveryNWaves", v)} />
      </div>

      <div style={sectionStyles}>
        <h2 style={{ marginBottom: "12px", fontSize: "16px" }}>{t("custom.sectionEnemies")}</h2>
        <h3 style={{ fontSize: "14px", marginBottom: "8px" }}>{t("custom.enemyBase")}</h3>
        <SliderRow label={t("custom.enemyLife")} value={form.enemies.base.life} min={5} max={100} step={1} onChange={(v) => updateDeep("enemies", "base", "life", v)} />
        <SliderRow label={t("custom.enemySpeed")} value={form.enemies.base.speed} min={0.5} max={8} step={0.5} onChange={(v) => updateDeep("enemies", "base", "speed", v)} />
        <SliderRow label={t("custom.enemyDamage")} value={form.enemies.base.damage} min={1} max={30} step={1} onChange={(v) => updateDeep("enemies", "base", "damage", v)} />
        <SliderRow label={t("custom.enemySize")} value={form.enemies.base.size} min={4} max={40} step={1} onChange={(v) => updateDeep("enemies", "base", "size", v)} />
        <SliderRow label={t("custom.enemyCount")} value={form.enemies.base.countPerWave} min={1} max={25} step={1} onChange={(v) => updateDeep("enemies", "base", "countPerWave", v)} />
        <h3 style={{ fontSize: "14px", marginBottom: "8px", marginTop: "12px" }}>{t("custom.enemyRapid")}</h3>
        <SliderRow label={t("custom.enemyLife")} value={form.enemies.rapid.life} min={2} max={50} step={1} onChange={(v) => updateDeep("enemies", "rapid", "life", v)} />
        <SliderRow label={t("custom.enemySpeed")} value={form.enemies.rapid.speed} min={1} max={10} step={0.5} onChange={(v) => updateDeep("enemies", "rapid", "speed", v)} />
        <SliderRow label={t("custom.enemyDamage")} value={form.enemies.rapid.damage} min={1} max={15} step={1} onChange={(v) => updateDeep("enemies", "rapid", "damage", v)} />
        <SliderRow label={t("custom.enemySize")} value={form.enemies.rapid.size} min={2} max={20} step={1} onChange={(v) => updateDeep("enemies", "rapid", "size", v)} />
        <SliderRow label={t("custom.enemyCount")} value={form.enemies.rapid.countPerWave} min={2} max={30} step={1} onChange={(v) => updateDeep("enemies", "rapid", "countPerWave", v)} />
        <h3 style={{ fontSize: "14px", marginBottom: "8px", marginTop: "12px" }}>{t("custom.enemyBoss")}</h3>
        <SliderRow label={t("custom.enemyLife")} value={form.enemies.boss.life} min={20} max={300} step={5} onChange={(v) => updateDeep("enemies", "boss", "life", v)} />
        <SliderRow label={t("custom.enemySpeed")} value={form.enemies.boss.speed} min={0.2} max={3} step={0.1} onChange={(v) => updateDeep("enemies", "boss", "speed", v)} />
        <SliderRow label={t("custom.enemyDamage")} value={form.enemies.boss.damage} min={10} max={80} step={1} onChange={(v) => updateDeep("enemies", "boss", "damage", v)} />
        <SliderRow label={t("custom.enemySize")} value={form.enemies.boss.size} min={16} max={80} step={2} onChange={(v) => updateDeep("enemies", "boss", "size", v)} />
      </div>

      <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
        <Link to="/" style={{ color: "#00ffcc", padding: "10px 20px", border: "2px solid #00ffcc", borderRadius: "6px", textDecoration: "none" }}>
          {t("custom.cancel")}
        </Link>
        <button type="button" style={{ ...pauseButtonStyles, padding: "10px 20px" }} onClick={handleLaunch}>
          {t("custom.launch")}
        </button>
      </div>
    </div>
  );
}

const pauseButtonStyles: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: 600,
  color: "#00ffcc",
  background: "rgba(0, 255, 204, 0.1)",
  border: "2px solid #00ffcc",
  borderRadius: "6px",
  cursor: "pointer",
};
