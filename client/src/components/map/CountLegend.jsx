import { useMemo } from "react";
import { lightenColor } from "../../utils/mapUtils";

export default function CountLegend({ operators, vehicles, bounds, isDark }) {
  const inView = useMemo(
    () => bounds ? vehicles.filter((v) => bounds.contains([v.lat, v.lon])) : vehicles,
    [vehicles, bounds]
  );
  const total = inView.length;
  const isMobile = window.innerWidth <= 480;
  const borderColor = isDark ? "rgba(255,255,255,0.1)" : "#eee";
  const textPrimary = isDark ? "#e2e6f0" : "#333";
  const textMuted = isDark ? "#6b7590" : "#888";
  const trackBg = isDark ? "rgba(255,255,255,0.1)" : "#eee";

  return (
    <div style={{
      position: "absolute",
      top: 12,
      right: 12,
      zIndex: 1000,
      background: isDark ? "rgba(17,24,39,0.97)" : "rgba(255,255,255,0.95)",
      border: isDark ? `1px solid ${borderColor}` : "none",
      borderRadius: 10,
      boxShadow: isDark ? "0 2px 12px rgba(0,0,0,0.4)" : "0 2px 12px rgba(0,0,0,0.15)",
      padding: isMobile ? "8px 10px" : "12px 16px",
      minWidth: isMobile ? 110 : 150,
      pointerEvents: "none",
    }}>
      {!isMobile && (
        <div style={{ fontSize: 11, fontWeight: 700, color: textMuted, marginBottom: 8, letterSpacing: 1 }}>
          AVAILABLE NOW
        </div>
      )}
      {operators.map((op) => {
        const count = inView.filter((v) => v.operatorId === op.id).length;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={op.id} style={{ marginBottom: isMobile ? 4 : 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isMobile ? 0 : 3 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: isMobile ? 11 : 13, fontWeight: 600, color: textPrimary }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: op.color, display: "inline-block", flexShrink: 0 }} />
                {op.name}
              </span>
              <span style={{ fontSize: isMobile ? 11 : 13, fontWeight: 700, color: isDark ? lightenColor(op.color) : op.color, marginLeft: 6 }}>{count.toLocaleString()}</span>
            </div>
            {!isMobile && (
              <div style={{ height: 4, borderRadius: 2, background: trackBg, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: isDark ? lightenColor(op.color) : op.color, borderRadius: 2 }} />
              </div>
            )}
          </div>
        );
      })}
      <div style={{ borderTop: `1px solid ${borderColor}`, marginTop: isMobile ? 4 : 8, paddingTop: isMobile ? 4 : 8, display: "flex", justifyContent: "space-between", fontSize: isMobile ? 11 : 12 }}>
        <span style={{ color: textMuted }}>Total</span>
        <span style={{ fontWeight: 700, color: textPrimary }}>{total.toLocaleString()}</span>
      </div>
    </div>
  );
}
