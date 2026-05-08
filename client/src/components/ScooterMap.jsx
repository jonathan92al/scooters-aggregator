import { MapContainer, TileLayer, Marker, Popup, Circle, Polygon, Polyline, useMap, useMapEvents } from "react-leaflet";
import { useEffect, useState, useMemo, useCallback, startTransition } from "react";
import "leaflet/dist/leaflet.css";
import { MAP_STYLES } from "../mapStyles";
import { DEFAULT_ZOOM, API_BASE, USER_ICON, haversineMeters } from "../utils/mapUtils";
import useDeviceHeading from "../hooks/useDeviceHeading";
import VehicleMarkers from "./map/VehicleMarkers";
import CountLegend from "./map/CountLegend";
import NearestScooter from "./map/NearestScooter";
import RoutePanel from "./map/RoutePanel";
import StyleSwitcher from "./map/StyleSwitcher";
import LocateMeButton from "./map/LocateMeButton";

function FlyToUser({ position }) {
  const map = useMap();
  useEffect(() => {
    map.setView(position, DEFAULT_ZOOM);
  }, [map, position]); // only on mount
  return null;
}

function FitRoute({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords?.length) map.fitBounds(coords, { padding: [60, 60] });
  }, [coords, map]);
  return null;
}

function BoundsTracker({ onBoundsChange }) {
  const map = useMapEvents({
    moveend: () => onBoundsChange(map.getBounds()),
    zoomend: () => onBoundsChange(map.getBounds()),
  });
  useEffect(() => { onBoundsChange(map.getBounds()); }, [map, onBoundsChange]);
  return null;
}

function HeadingCone({ center, heading }) {
  const positions = useMemo(() => {
    if (heading == null) return null;
    const [lat, lng] = center;
    const radiusM = 20;
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

  const navigateTo = useCallback(async function (vehicle) {
    setRouteLoading(true);
    setRoute(null);
    try {
      const [uLat, uLon] = userLocation;
      const res = await fetch(
        `${API_BASE}/api/route?fromLat=${uLat}&fromLon=${uLon}&toLat=${vehicle.lat}&toLon=${vehicle.lon}`
      );
      const data = await res.json();
      if (data.coords) setRoute({ ...data, vehicle });
    } catch {
      // fall back gracefully
    } finally {
      setRouteLoading(false);
    }
  }, [userLocation]);

  useEffect(() => {
    if (!route) return;
    const d = haversineMeters(userLocation, [route.vehicle.lat, route.vehicle.lon]);
    if (d <= 20) startTransition(() => setRoute(null));
  }, [userLocation, route]);

  return (
    <div style={{ height: "100%", width: "100%", position: "relative" }}>
      <MapContainer
        center={userLocation}
        zoom={DEFAULT_ZOOM}
        minZoom={13}
        maxZoom={19}
        maxBounds={[[32.02, 34.74], [32.13, 34.84]]}
        maxBoundsViscosity={1.0}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          key={tileStyle.id}
          attribution={tileStyle.attribution}
          url={tileStyle.url}
          maxZoom={19}
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
        {(heading == null || window.innerWidth > 480) && (
          <Circle
            center={userLocation}
            radius={15}
            pathOptions={{ color: "#2979ff", fillColor: "#2979ff", fillOpacity: 0.08, weight: 2 }}
          />
        )}
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
      {!route && !routeLoading && (
        <NearestScooter vehicles={vehicles} userLocation={userLocation} onNavigate={navigateTo} isDark={isDark} />
      )}
      <RoutePanel route={route} routeLoading={routeLoading} onClose={() => setRoute(null)} isDark={isDark} />
      <StyleSwitcher activeId={mapStyleId} onChange={onMapStyleChange} />
    </div>
  );
}
