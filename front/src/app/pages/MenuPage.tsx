/**
 * Main menu: Jouer, Partie personnalisée, Charger un replay, Paramètres.
 */
import { Link } from "react-router-dom";

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
  fontSize: "42px",
  fontWeight: "bold",
  marginBottom: "16px",
  textShadow: "0 0 20px rgba(0, 255, 204, 0.5)",
};

const linkStyles: React.CSSProperties = {
  padding: "14px 32px",
  fontSize: "18px",
  fontWeight: 600,
  color: "#00ffcc",
  background: "rgba(0, 255, 204, 0.1)",
  border: "2px solid #00ffcc",
  borderRadius: "8px",
  textDecoration: "none",
  transition: "background 0.15s, box-shadow 0.15s",
};

export function MenuPage() {
  return (
    <div style={menuStyles}>
      <h1 style={titleStyles}>Tower Defense</h1>
      <nav style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <Link to="/play" style={linkStyles}>
          Jouer
        </Link>
        <Link to="/custom" style={linkStyles}>
          Partie personnalisée
        </Link>
        <Link to="/replay" style={linkStyles}>
          Charger un replay
        </Link>
        <Link to="/settings" style={linkStyles}>
          Paramètres
        </Link>
      </nav>
    </div>
  );
}
