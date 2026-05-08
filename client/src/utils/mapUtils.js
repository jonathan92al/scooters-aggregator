import L from "leaflet";

export const DEFAULT_ZOOM = 18;
export const API_BASE = (import.meta.env.VITE_API_BASE ?? "").replace(/\/$/, "");

export const USER_ICON = L.divIcon({
  html: `<div style="
    width:16px;height:16px;border-radius:50%;
    background:#2979ff;border:3px solid white;
    box-shadow:0 0 0 3px rgba(41,121,255,0.35),0 2px 6px rgba(0,0,0,0.4);
  "></div>`,
  className: "",
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

export function lightenColor(hex, amount = 0.5) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.round(r + (255 - r) * amount)},${Math.round(g + (255 - g) * amount)},${Math.round(b + (255 - b) * amount)})`;
}

export function batteryColor(pct) {
  if (pct >= 60) return "#2ecc71";
  if (pct >= 30) return "#f39c12";
  return "#e74c3c";
}

export function haversineMeters([lat1, lon1], [lat2, lon2]) {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const iconCache = new Map();

export function makeIcon(operatorColor, batteryPercent) {
  const key = `${operatorColor}-${batteryPercent}`;
  if (iconCache.has(key)) return iconCache.get(key);

  const hasBattery = batteryPercent != null;
  const barColor = hasBattery ? batteryColor(batteryPercent) : "#ccc";

  const html = `
    <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
      <div style="
        width:14px;height:14px;border-radius:50%;
        background:${operatorColor};
        border:2px solid white;
        box-shadow:0 1px 4px rgba(0,0,0,0.4);
      "></div>
      ${hasBattery ? `
        <div style="
          width:18px;height:4px;border-radius:2px;
          background:#ddd;overflow:hidden;
          box-shadow:0 1px 2px rgba(0,0,0,0.2);
        ">
          <div style="width:${Math.max(2, Math.round(batteryPercent * 0.18))}px;height:100%;background:${barColor};border-radius:2px;"></div>
        </div>
      ` : ""}
    </div>
  `;

  const icon = L.divIcon({
    html,
    className: "",
    iconSize: [18, hasBattery ? 22 : 14],
    iconAnchor: [9, hasBattery ? 11 : 7],
    popupAnchor: [0, hasBattery ? -13 : -9],
  });
  iconCache.set(key, icon);
  return icon;
}

export function trackClick(vehicle, action, distanceMeters) {
  fetch(`${API_BASE}/api/analytics/click`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      operatorId: vehicle.operatorId,
      operatorName: vehicle.operatorName,
      vehicleId: vehicle.id,
      action,
      distanceMeters: distanceMeters != null ? Math.round(distanceMeters) : null,
    }),
  }).catch(() => {});
}
