import { useState, useEffect, useCallback, useRef } from "react";

export default function useDeviceHeading() {
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
    } catch (err) {
      console.warn("Orientation permission denied:", err);
    }
  }, [startListening]);

  return { heading, requestPermission };
}
