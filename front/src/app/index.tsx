/**
 * Front entry point: mounts React app with router (menu, play, settings, etc.).
 */
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Missing #root");

createRoot(rootEl).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
