import { useMemo } from "react";
import { haversineMeters, batteryColor } from "../../utils/mapUtils";
import { RideButton } from "./VehicleMarkers";

export default function NearestScooter({ vehicles, userLocation, onNavigate, isDark }) {
  const nearest = useMemo(() => {
    if (!vehicles.length) return null;
    return vehicles.reduce((best, v) => {
      const d = haversineMeters(userLocation, [v.lat, v.lon]);
      return d < best.distance ? { ...v, distance: d } : best;
    }, { distance: Infinity });
  }, [vehicles, userLocation]);

  if (!nearest) return null;

  const distLabel = nearest.distance < 1000
    ? `${Math.round(nearest.distance)}m away`
    : `${(nearest.distance / 1000).toFixed(1)}km away`;

  return (
    <div style={{
      position: "absolute",
      bottom: 48,
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 1000,
      background: isDark ? "rgba(17,24,39,0.97)" : "rgba(255,255,255,0.97)",
      border: isDark ? "1px solid rgba(255,255,255,0.1)" : "none",
      borderRadius: 12,
      boxShadow: isDark ? "0 4px 16px rgba(0,0,0,0.5)" : "0 4px 16px rgba(0,0,0,0.18)",
      padding: "10px 14px",
      display: "flex",
      alignItems: "center",
      gap: 12,
      pointerEvents: "auto",
      whiteSpace: "nowrap",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: nearest.color, flexShrink: 0, display: "inline-block" }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: isDark ? "#e2e6f0" : "#222" }}>
            {nearest.operatorName}
            <span style={{ fontWeight: 400, color: isDark ? "#6b7590" : "#888", marginLeft: 6 }}>{distLabel}</span>
          </div>
          {nearest.batteryPercent != null && (
            <div style={{ fontSize: 11, color: batteryColor(nearest.batteryPercent), fontWeight: 600 }}>
              Battery {nearest.batteryPercent}%
            </div>
          )}
        </div>
      </div>
      <RideButton vehicle={nearest} distanceM={nearest.distance} userLocation={userLocation} onNavigate={onNavigate} style={{ padding: "5px 12px" }} />
    </div>
  );
}
