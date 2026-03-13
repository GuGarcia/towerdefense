/**
 * Placeholder: Partie personnalisée form (ROADMAP_V4_MENU §4).
 */
import { Link } from "react-router-dom";

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

export function CustomPage() {
  return (
    <div style={pageStyles}>
      <h1 style={{ fontSize: "28px" }}>Partie personnalisée</h1>
      <p style={{ color: "rgba(0, 255, 204, 0.8)" }}>Formulaire à venir (sliders Joueur, Économie, Vagues, Ennemis).</p>
      <Link to="/" style={{ color: "#00ffcc", padding: "8px 16px", border: "1px solid #00ffcc", borderRadius: "6px" }}>
        Retour au menu
      </Link>
    </div>
  );
}
