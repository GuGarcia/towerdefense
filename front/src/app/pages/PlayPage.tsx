/**
 * Game view: renders the player DOM (toolbar, canvas, overlay, upgrade bars) and runs the game loop.
 * On unmount, stops the clock and removes listeners.
 */
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { runPlayer } from "../../player";

const containerStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  width: "100%",
  height: "100vh",
  overflow: "hidden",
  background: "#0a0a0f",
};

export function PlayPage() {
  const navigate = useNavigate();
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let cancelled = false;
    runPlayer({
      onBackToMenu: () => navigate("/"),
    }).then(({ stop }) => {
      if (!cancelled) stopRef.current = stop;
    });
    return () => {
      cancelled = true;
      stopRef.current?.();
      stopRef.current = null;
    };
  }, [navigate]);

  return (
    <div style={containerStyles}>
      <div id="replay-toolbar" />
      <div id="game-wrapper" style={{ flex: 1, minHeight: 0, position: "relative", display: "flex" }}>
        <canvas id="game" style={{ display: "block", width: "100%", height: "100%" }} width={800} height={600} />
        <div
          id="game-overlay"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
            zIndex: 10,
            display: "none",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "24px",
            background: "rgba(0,0,0,0.6)",
          }}
        >
          <span className="game-over-title">GAME OVER</span>
          <span className="game-over-stats" />
          <button type="button" className="btn-replay-overlay">
            Rejouer
          </button>
        </div>
      </div>
      <div id="upgrade-bars" />
    </div>
  );
}
