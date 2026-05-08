import { memo, useCallback } from "react";
import { Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import { haversineMeters, makeIcon, batteryColor, trackClick } from "../../utils/mapUtils";

const NEARBY_THRESHOLD_M = 10;

function PricingLine({ pricing }) {
  if (!pricing) return <div style={{ fontSize: 11, color: "#aaa", marginTop: 5 }}>Check app for pricing</div>;
  const symbol = pricing.currency === "ILS" ? "₪" : pricing.currency;
  const parts = [];
  if (pricing.unlockFee != null) parts.push(`${symbol}${pricing.unlockFee} unlock`);
  if (pricing.perMinute != null) parts.push(`${symbol}${pricing.perMinute}/min`);
  return <div style={{ fontSize: 11, color: "#555", marginTop: 5 }}>{parts.join(" · ")}</div>;
}

export function RideButton({ vehicle, distanceM, onNavigate, style = {} }) {
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
            onNavigate={onNavigate}
            style={{ marginTop: 8, padding: "6px 12px" }}
          />
        </div>
      </Popup>
    </Marker>
  );
});

export default function VehicleMarkers({ vehicles, userLocation, pricingByOperator, navigateTo }) {
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
