/**
 * Persist custom game form configs (name + form state) in localStorage.
 */
const CONFIGS_KEY = "towerdefense_custom_configs";
const MAX_CONFIGS = 20;

export interface SavedCustomConfig {
  id: string;
  name: string;
  form: unknown;
}

function getStored(): SavedCustomConfig[] {
  try {
    const raw = localStorage.getItem(CONFIGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedCustomConfig[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setStored(configs: SavedCustomConfig[]): void {
  try {
    localStorage.setItem(CONFIGS_KEY, JSON.stringify(configs.slice(0, MAX_CONFIGS)));
  } catch {
    // ignore
  }
}

export function getSavedConfigs(): SavedCustomConfig[] {
  return getStored();
}

export function saveConfig(name: string, form: unknown): void {
  const configs = getStored();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  configs.unshift({ id, name: name.trim() || "Sans nom", form });
  setStored(configs);
}

export function deleteConfig(id: string): void {
  setStored(getStored().filter((c) => c.id !== id));
}
