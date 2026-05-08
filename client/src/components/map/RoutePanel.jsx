export default function RoutePanel({ route, routeLoading, onClose, isDark }) {
  if (routeLoading) {
    return (
      <div style={{
        position: "absolute",
        bottom: 48,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1000,
        background: isDark ? "rgba(17,24,39,0.97)" : "rgba(255,255,255,0.95)",
        border: isDark ? "1px solid rgba(255,255,255,0.1)" : "none",
        borderRadius: 12,
        boxShadow: isDark ? "0 4px 16px rgba(0,0,0,0.5)" : "0 4px 16px rgba(0,0,0,0.15)",
        padding: "10px 20px",
        fontSize: 13,
        color: isDark ? "#a0aabf" : "#555",
      }}>
        Finding route...
      </div>
    );
  }

  if (!route) return null;

  return (
    <div style={{
      position: "absolute",
      bottom: 48,
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 1000,
      background: "#2979ff",
      color: "white",
      borderRadius: 12,
      boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
      padding: "10px 16px",
      display: "flex",
      alignItems: "center",
      gap: 14,
      whiteSpace: "nowrap",
      fontSize: 13,
      fontWeight: 600,
    }}>
      <span>🚶 {route.duration} min · {route.distance}m to {route.vehicle.operatorName}</span>
      <button
        onClick={onClose}
        style={{ background: "rgba(255,255,255,0.25)", border: "none", color: "white", borderRadius: 6, padding: "3px 10px", cursor: "pointer", fontWeight: 700, fontSize: 13 }}
      >
        ✕
      </button>
    </div>
  );
}
