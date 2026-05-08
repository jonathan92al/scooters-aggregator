import { MapContainer, TileLayer, Marker, Popup, Circle, Polygon, Polyline, useMap, useMapEvents } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { useEffect, useState, useMemo, useCallback, memo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocationArrow, faMoon } from "@fortawesome/free-solid-svg-icons";
import { MAP_STYLES } from "../mapStyles";

const DEFAULT_ZOOM = 18;
const API_BASE = import.meta.env.VITE_API_BASE ?? "";

const USER_ICON = L.divIcon({
  html: `<div style="
    width:16px;height:16px;border-radius:50%;
    background:#2979ff;border:3px solid white;
    box-shadow:0 0 0 3px rgba(41,121,255,0.35),0 2px 6px rgba(0,0,0,0.4);
  "></div>`,
  className: "",
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

function FlyToUser({ position }) {
  const map = useMap();
  useEffect(() => {
    map.setView(position, DEFAULT_ZOOM);
  }, []); // only on mount
  return null;
}

function FitRoute({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords?.length) map.fitBounds(coords, { padding: [60, 60] });
  }, [coords]);
  return null;
}

function BoundsTracker({ onBoundsChange }) {
  const map = useMapEvents({
    moveend: () => onBoundsChange(map.getBounds()),
    zoomend: () => onBoundsChange(map.getBounds()),
  });
  useEffect(() => { onBoundsChange(map.getBounds()); }, []);
  return null;
}

function lightenColor(hex, amount = 0.5) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.round(r + (255 - r) * amount)},${Math.round(g + (255 - g) * amount)},${Math.round(b + (255 - b) * amount)})`;
}

function batteryColor(pct) {
  if (pct >= 60) return "#2ecc71";
  if (pct >= 30) return "#f39c12";
  return "#e74c3c";
}

function haversineMeters([lat1, lon1], [lat2, lon2]) {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function NearestScooter({ vehicles, userLocation, onNavigate, isDark }) {
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

const iconCache = new Map();

function makeIcon(operatorColor, batteryPercent) {
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

function CountLegend({ operators, vehicles, bounds, isDark }) {
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

function useDeviceHeading() {
  const [heading, setHeading] = useState(null);
  const handlerRef = useRef(null);

  const startListening = useCallback(() => {
    if (handlerRef.current) return;
    function onOrientation(e) {
      const h = e.webkitCompassHeading != null
        ? e.webkitCompassHeading
        : e.absolute && e.alpha != null
          ? (360 - e.alpha + 360) % 360
          : null;
      if (h != null) setHeading(h);
    }
    handlerRef.current = onOrientation;
    window.addEventListener("deviceorientation", onOrientation, true);
  }, []);

  useEffect(() => {
    if (typeof DeviceOrientationEvent === "undefined") return;
    if (typeof DeviceOrientationEvent.requestPermission === "function") return; // iOS — needs gesture
    startListening();
    return () => {
      if (handlerRef.current) window.removeEventListener("deviceorientation", handlerRef.current, true);
    };
  }, [startListening]);

  const requestPermission = useCallback(async () => {
    if (typeof DeviceOrientationEvent?.requestPermission !== "function") return;
    try {
      const result = await DeviceOrientationEvent.requestPermission();
      if (result === "granted") startListening();
    } catch {}
  }, [startListening]);

  return { heading, requestPermission };
}

function HeadingCone({ center, heading }) {
  const positions = useMemo(() => {
    if (heading == null) return null;
    const [lat, lng] = center;
    const radiusM = 80;
    const spreadDeg = 28;
    const steps = 24;
    const latPerM = 1 / 111320;
    const lngPerM = 1 / (111320 * Math.cos((lat * Math.PI) / 180));
    const pts = [[lat, lng]];
    for (let i = 0; i <= steps; i++) {
      const bearing = ((heading - spreadDeg) + (i / steps) * spreadDeg * 2) * (Math.PI / 180);
      pts.push([lat + radiusM * Math.cos(bearing) * latPerM, lng + radiusM * Math.sin(bearing) * lngPerM]);
    }
    return pts;
  }, [center, heading]);

  if (!positions) return null;
  return (
    <Polygon
      positions={positions}
      pathOptions={{ color: "#2979ff", fillColor: "#2979ff", fillOpacity: 0.2, weight: 0 }}
    />
  );
}

function LocateMeButton({ userLocation, isDark, onRequestOrientation }) {
  const map = useMap();
  const [located, setLocated] = useState(true);

  useMapEvents({
    movestart: () => setLocated(false),
  });

  const handleClick = () => {
    map.flyTo(userLocation, DEFAULT_ZOOM);
    setLocated(true);
    onRequestOrientation?.();
  };

  const idleBg = isDark ? "rgba(17,24,39,0.97)" : "rgba(255,255,255,0.95)";
  const idleColor = isDark ? "#6b7590" : "#aaa";

  return (
    <button
      onClick={handleClick}
      title="Re-center on my location"
      style={{
        position: "absolute",
        bottom: 80,
        left: 12,
        zIndex: 1000,
        width: 44,
        height: 44,
        borderRadius: "50%",
        border: isDark && !located ? "1px solid rgba(255,255,255,0.1)" : "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: located ? "#2979ff" : idleBg,
        boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
        transition: "background 0.2s",
        touchAction: "manipulation",
      }}
    >
      <FontAwesomeIcon
        icon={faLocationArrow}
        style={{ color: located ? "white" : idleColor, fontSize: 16, transition: "color 0.2s" }}
      />
    </button>
  );
}

const NEARBY_THRESHOLD_M = 10;

function trackClick(vehicle, action, distanceMeters) {
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

function RideButton({ vehicle, distanceM, userLocation, onNavigate, style = {} }) {
  const isNearby = distanceM !== null && distanceM <= NEARBY_THRESHOLD_M;
  const baseStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px 14px",
    background: vehicle.color,
    color: "white",
    borderRadius: 6,
    fontWeight: 700,
    fontSize: 13,
    textDecoration: "none",
    flexShrink: 0,
    cursor: "pointer",
    border: "none",
    touchAction: "manipulation",
    minHeight: 36,
    ...style,
  };

  if (isNearby) {
    return (
      <a
        href={vehicle.deepLink || vehicle.website}
        target="_blank"
        rel="noopener noreferrer"
        style={baseStyle}
        onClick={() => trackClick(vehicle, "ride_now", distanceM)}
      >
        Ride Now
      </a>
    );
  }

  return (
    <button
      onClick={() => {
        trackClick(vehicle, "take_me_there", distanceM);
        onNavigate?.(vehicle);
      }}
      style={baseStyle}
    >
      Take Me There
    </button>
  );
}

function StyleSwitcher({ activeId, onChange }) {
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

function PricingLine({ pricing }) {
  if (!pricing) return <div style={{ fontSize: 11, color: "#aaa", marginTop: 5 }}>Check app for pricing</div>;
  const symbol = pricing.currency === "ILS" ? "₪" : pricing.currency;
  const parts = [];
  if (pricing.unlockFee != null) parts.push(`${symbol}${pricing.unlockFee} unlock`);
  if (pricing.perMinute != null) parts.push(`${symbol}${pricing.perMinute}/min`);
  return <div style={{ fontSize: 11, color: "#555", marginTop: 5 }}>{parts.join(" · ")}</div>;
}

const VehicleMarker = memo(function VehicleMarker({ vehicle, userLocation, pricing, onNavigate }) {
  const distanceM = haversineMeters(userLocation, [vehicle.lat, vehicle.lon]);
  const distLabel = distanceM < 1000 ? `${Math.round(distanceM)}m` : `${(distanceM / 1000).toFixed(1)}km`;
  return (
    <Marker
      position={[vehicle.lat, vehicle.lon]}
      icon={makeIcon(vehicle.color, vehicle.batteryPercent)}
    >
      <Popup>
        <div style={{ minWidth: 140, maxWidth: "80vw" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <strong style={{ color: vehicle.color, fontSize: 14 }}>{vehicle.operatorName}</strong>
            <span style={{ fontSize: 12, color: "#888" }}>{distLabel} away</span>
          </div>
          {vehicle.batteryPercent != null && (
            <div style={{ marginTop: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                <span>Battery</span>
                <span style={{ fontWeight: 600, color: batteryColor(vehicle.batteryPercent) }}>
                  {vehicle.batteryPercent}%
                </span>
              </div>
              <div style={{ height: 5, borderRadius: 3, background: "#eee", overflow: "hidden" }}>
                <div style={{ width: `${vehicle.batteryPercent}%`, height: "100%", background: batteryColor(vehicle.batteryPercent), borderRadius: 3 }} />
              </div>
            </div>
          )}
          <PricingLine pricing={pricing} />
          <RideButton
            vehicle={vehicle}
            distanceM={distanceM}
            userLocation={userLocation}
            onNavigate={onNavigate}
            style={{ marginTop: 8, padding: "6px 12px" }}
          />
        </div>
      </Popup>
    </Marker>
  );
});

function VehicleMarkers({ vehicles, userLocation, pricingByOperator, navigateTo }) {
  const map = useMap();

  const clusterIconFn = useCallback((cluster) => {
    const count = cluster.getChildCount();
    const size = count < 10 ? 34 : count < 100 ? 40 : 46;
    const fontSize = count < 100 ? 13 : 11;
    return L.divIcon({
      html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:#607d8b;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:${fontSize}px;color:white;font-family:sans-serif;">${count}</div>`,
      className: "",
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }, []);

  const handleNavigate = useCallback((vehicle) => {
    map.closePopup();
    navigateTo(vehicle);
  }, [map, navigateTo]);

  return (
    <MarkerClusterGroup chunkedLoading disableClusteringAtZoom={17} zoomToBoundsOnClick spiderfyOnMaxZoom={false} showCoverageOnHover={false} animate={false} iconCreateFunction={clusterIconFn}>
      {vehicles.map((vehicle) => (
        <VehicleMarker
          key={vehicle.id}
          vehicle={vehicle}
          userLocation={userLocation}
          pricing={pricingByOperator[vehicle.operatorId]}
          onNavigate={handleNavigate}
        />
      ))}
    </MarkerClusterGroup>
  );
}

export default function ScooterMap({ vehicles, operators, userLocation, mapStyleId, onMapStyleChange, isDark }) {
  const tileStyle = MAP_STYLES.find((s) => s.id === mapStyleId) ?? MAP_STYLES[0];
  const [bounds, setBounds] = useState(null);
  const [route, setRoute] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const { heading, requestPermission } = useDeviceHeading();

  const pricingByOperator = useMemo(
    () => Object.fromEntries(operators.map((o) => [o.id, o.pricing ?? null])),
    [operators]
  );

  const navigateTo = useCallback(async function(vehicle) {
    setRouteLoading(true);
    setRoute(null);
    try {
      const [uLat, uLon] = userLocation;
      const res = await fetch(
        `${API_BASE}/api/route?fromLat=${uLat}&fromLon=${uLon}&toLat=${vehicle.lat}&toLon=${vehicle.lon}`
      );
      const data = await res.json();
      if (data.coords) {
        setRoute({ ...data, vehicle });
      }
    } catch {
      // fall back gracefully — button just does nothing visible
    } finally {
      setRouteLoading(false);
    }
  }, [userLocation]);

  useEffect(() => {
    if (!route) return;
    const d = haversineMeters(userLocation, [route.vehicle.lat, route.vehicle.lon]);
    if (d <= 20) setRoute(null);
  }, [userLocation, route]);

  return (
    <div style={{ height: "100%", width: "100%", position: "relative" }}>
      <MapContainer
        center={userLocation}
        zoom={DEFAULT_ZOOM}
        minZoom={13}
        maxBounds={[[32.02, 34.74], [32.13, 34.84]]}
        maxBoundsViscosity={1.0}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          key={tileStyle.id}
          attribution={tileStyle.attribution}
          url={tileStyle.url}
        />
        <FlyToUser position={userLocation} />
        <BoundsTracker onBoundsChange={setBounds} />
        <HeadingCone center={userLocation} heading={heading} />
        <LocateMeButton userLocation={userLocation} isDark={isDark} onRequestOrientation={requestPermission} />
        {route && (
          <>
            <Polyline
              positions={route.coords}
              pathOptions={{ color: "#2979ff", weight: 5, opacity: 0.85, dashArray: "10, 6" }}
            />
            <FitRoute coords={route.coords} />
          </>
        )}
        <Circle
          center={userLocation}
          radius={15}
          pathOptions={{ color: "#2979ff", fillColor: "#2979ff", fillOpacity: 0.08, weight: 2 }}
        />
        <Marker position={userLocation} icon={USER_ICON}>
          <Popup>You are here</Popup>
        </Marker>
        <VehicleMarkers
          vehicles={vehicles}
          userLocation={userLocation}
          pricingByOperator={pricingByOperator}
          navigateTo={navigateTo}
        />
      </MapContainer>
      <CountLegend operators={operators} vehicles={vehicles} bounds={bounds} isDark={isDark} />
      {!route && !routeLoading && <NearestScooter vehicles={vehicles} userLocation={userLocation} onNavigate={navigateTo} isDark={isDark} />}
      {route && (
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
            onClick={() => setRoute(null)}
            style={{ background: "rgba(255,255,255,0.25)", border: "none", color: "white", borderRadius: 6, padding: "3px 10px", cursor: "pointer", fontWeight: 700, fontSize: 13 }}
          >
            ✕
          </button>
        </div>
      )}
      {routeLoading && (
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
      )}
      <StyleSwitcher activeId={mapStyleId} onChange={onMapStyleChange} />
    </div>
  );
}
