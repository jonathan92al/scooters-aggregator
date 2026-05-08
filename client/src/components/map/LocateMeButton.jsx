import { useState } from "react";
import { useMap, useMapEvents } from "react-leaflet";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocationArrow } from "@fortawesome/free-solid-svg-icons";
import { DEFAULT_ZOOM } from "../../utils/mapUtils";

export default function LocateMeButton({ userLocation, isDark, onRequestOrientation }) {
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
