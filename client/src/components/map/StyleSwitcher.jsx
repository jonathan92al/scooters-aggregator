import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMoon } from "@fortawesome/free-solid-svg-icons";

export default function StyleSwitcher({ activeId, onChange }) {
  const isDark = activeId === "carto-dark";
  return (
    <button
      onClick={() => onChange(isDark ? "carto-light" : "carto-dark")}
      title={isDark ? "Switch to light map" : "Switch to dark map"}
      style={{
        position: "absolute",
        bottom: 28,
        left: 12,
        zIndex: 1000,
        width: 44,
        height: 44,
        borderRadius: "50%",
        border: "none",
        cursor: "pointer",
        fontSize: 18,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: isDark ? "#1a1a2e" : "rgba(255,255,255,0.95)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
        transition: "background 0.2s",
        touchAction: "manipulation",
      }}
    >
      {isDark ? (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1"  x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="1"  y1="12" x2="3"  y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22"  y1="4.22"  x2="5.64"  y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="19.78" y1="4.22"  x2="18.36" y2="5.64" />
          <line x1="5.64"  y1="18.36" x2="4.22"  y2="19.78" />
        </svg>
      ) : (
        <FontAwesomeIcon icon={faMoon} style={{ color: "#333", fontSize: 16 }} />
      )}
    </button>
  );
}
