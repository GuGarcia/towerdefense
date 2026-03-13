/**
 * Translation keys and types. Add keys here and in fr.ts / en.ts.
 */
export type Locale = "fr" | "en";

export const defaultLocale: Locale = "fr";

export type TranslationKeys = {
  "menu.title": string;
  "menu.play": string;
  "menu.customGame": string;
  "menu.loadReplay": string;
  "menu.settings": string;
  "common.backToMenu": string;
  "settings.title": string;
  "settings.language": string;
  "settings.volume": string;
  "settings.volumePlaceholder": string;
  "custom.title": string;
  "custom.placeholder": string;
  "replay.title": string;
  "replay.placeholder": string;
  "pause.title": string;
  "pause.resume": string;
  "pause.export": string;
  "pause.loadReplay": string;
  "pause.settings": string;
  "pause.quit": string;
  "pause.speed": string;
  "gameOver.title": string;
  "gameOver.replay": string;
  "gameOver.backToMenu": string;
};
