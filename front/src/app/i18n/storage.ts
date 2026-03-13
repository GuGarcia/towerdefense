/**
 * Read / write locale from localStorage (key towerdefense_settings).
 * Used at app boot and by Settings page.
 */
import type { Locale } from "./translations";
import { defaultLocale } from "./translations";

const SETTINGS_KEY = "towerdefense_settings";

export type StoredSettings = {
  language?: Locale;
  volume?: number;
};

export function getStoredSettings(): StoredSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as StoredSettings;
    return parsed ?? {};
  } catch {
    return {};
  }
}

export function setStoredSettings(settings: StoredSettings): void {
  try {
    const current = getStoredSettings();
    const merged = { ...current, ...settings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
  } catch {
    // ignore
  }
}

export function getStoredLocale(): Locale {
  const lang = getStoredSettings().language;
  return lang === "en" || lang === "fr" ? lang : defaultLocale;
}
