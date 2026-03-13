/**
 * Root app: router and route definitions for menu, play, custom, replay, settings.
 */
import { Routes, Route } from "react-router-dom";
import { MenuPage } from "./pages/MenuPage";
import { PlayPage } from "./pages/PlayPage";
import { CustomPage } from "./pages/CustomPage";
import { ReplayPage } from "./pages/ReplayPage";
import { SettingsPage } from "./pages/SettingsPage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<MenuPage />} />
      <Route path="/play" element={<PlayPage />} />
      <Route path="/custom" element={<CustomPage />} />
      <Route path="/replay" element={<ReplayPage />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Routes>
  );
}
