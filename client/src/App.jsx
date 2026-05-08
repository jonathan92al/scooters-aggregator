import { useState, useEffect, useCallback, useMemo, useDeferredValue } from "react";
import ScooterMap from "./components/ScooterMap";
import FilterBar from "./components/FilterBar";
import ErrorPage from "./pages/ErrorPage";
import "./App.css";

const REFRESH_INTERVAL_MS = 30_000;
const DUMMY_LOCATION = [32.086584, 34.779584];
const API_BASE = (import.meta.env.VITE_API_BASE ?? "").replace(/\/$/, "");

export default function App() {
  const [fetchState, setFetchState] = useState({ data: null, loading: true, error: null });
  const { data, loading, error } = fetchState;
  const [activeOperators, setActiveOperators] = useState(new Set());
  const [mapStyleId, setMapStyleId] = useState(
    () => localStorage.getItem("mapStyleId") ?? "carto-light"
  );
  const handleMapStyleChange = useCallback((id) => {
    setMapStyleId(id);
    localStorage.setItem("mapStyleId", id);
  }, []);

  // Real geolocation — uncomment to use device GPS instead of dummy location
  // const [userLocation, setUserLocation] = useState(DUMMY_LOCATION);
  // useEffect(() => {
  //   if (!navigator.geolocation) return;
  //   navigator.geolocation.getCurrentPosition(
  //     (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
  //     () => {} // keep dummy on error
  //   );
  //   const watchId = navigator.geolocation.watchPosition(
  //     (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
  //     () => {}
  //   );
  //   return () => navigator.geolocation.clearWatch(watchId);
  // }, []);
  const userLocation = DUMMY_LOCATION;

  const fetchVehicles = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/vehicles`);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const json = await res.json();
      setFetchState({ data: json, loading: false, error: null });
      setActiveOperators((prev) =>
        prev.size === 0 ? new Set(json.operators.map((o) => o.id)) : prev
      );
    } catch (err) {
      setFetchState((prev) => ({ ...prev, loading: false, error: err.message }));
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
    const interval = setInterval(fetchVehicles, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchVehicles]);

  const toggleOperator = (id) => {
    setActiveOperators((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const visibleVehicles = useMemo(
    () => data?.vehicles.filter((v) => activeOperators.has(v.operatorId)) ?? [],
    [data?.vehicles, activeOperators]
  );
  const deferredVehicles = useDeferredValue(visibleVehicles);

  if (error && !data) return <ErrorPage onRetry={fetchVehicles} />;

  return (
    <div className={`app${mapStyleId === "carto-dark" ? " dark" : ""}`}>
      <header className="header">
        <h1>🛴 Tel Aviv Scooters</h1>
        {data && (
          <FilterBar
            operators={data.operators}
            activeOperators={activeOperators}
            onToggle={toggleOperator}
            isDark={mapStyleId === "carto-dark"}
          />
        )}
      </header>

      <main className="map-container">
        {loading && <div className="overlay">Loading scooters...</div>}
        {error && data && (
          <div className="overlay error">
            <span>Failed to refresh</span>
            <button onClick={fetchVehicles}>Retry</button>
          </div>
        )}
        <ScooterMap
          vehicles={deferredVehicles}
          operators={data?.operators ?? []}
          userLocation={userLocation}
          mapStyleId={mapStyleId}
          onMapStyleChange={handleMapStyleChange}
          isDark={mapStyleId === "carto-dark"}
        />
      </main>

    </div>
  );
}
