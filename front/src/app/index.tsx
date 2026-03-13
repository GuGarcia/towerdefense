/**
 * Front entry point: mounts React app with router (menu, play, settings, etc.).
 */
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { I18nProvider } from "./i18n/context";
import { getStoredLocale } from "./i18n/storage";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Missing #root");

const initialLocale = getStoredLocale();

createRoot(rootEl).render(
  <I18nProvider initialLocale={initialLocale}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </I18nProvider>
);
