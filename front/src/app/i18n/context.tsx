/**
 * i18n context: locale + t(key) for app shell. Locale persisted in localStorage (see settings).
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Locale, TranslationKeys } from "./translations";
import { defaultLocale } from "./translations";
import { fr } from "./fr";
import { en } from "./en";

const messages: Record<Locale, TranslationKeys> = { fr, en };

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: keyof TranslationKeys) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  children,
  initialLocale = defaultLocale,
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
  }, []);
  const t = useCallback(
    (key: keyof TranslationKeys) => messages[locale][key] ?? key,
    [locale]
  );
  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t]
  );
  return (
    <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
