const express = require("express");
const cors = require("cors");
const compression = require("compression");
const axios = require("axios");
const https = require("https");
const { OPERATORS } = require("./operators");
const { fetchAllVehicles } = require("./gbfs");
const { fetchAllPricing } = require("./pricing");
const { record, summary } = require("./analytics");

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(compression());
app.use(cors());
app.use(express.json());

app.get("/api/vehicles", async (req, res) => {
  try {
    const [{ vehicles, errors }, pricing] = await Promise.all([
      fetchAllVehicles(OPERATORS),
      fetchAllPricing(OPERATORS),
    ]);
    res.json({
      vehicles,
      operators: OPERATORS.map(({ id, name, color, website }) => ({
        id, name, color, website, pricing: pricing[id] ?? null,
      })),
      errors: errors.length ? errors : undefined,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/operators", (_req, res) => {
  res.json(OPERATORS.map(({ id, name, color }) => ({ id, name, color })));
});

function decodePolyline6(str) {
  let index = 0, lat = 0, lng = 0;
  const coords = [];
  while (index < str.length) {
    let shift = 0, result = 0, b;
    do { b = str.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : (result >> 1);
    shift = result = 0;
    do { b = str.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : (result >> 1);
    coords.push([lat / 1e6, lng / 1e6]);
  }
  return coords;
}

app.get("/api/route", async (req, res) => {
  const { fromLat, fromLon, toLat, toLon } = req.query;
  if (!fromLat || !fromLon || !toLat || !toLon) return res.status(400).json({ error: "Missing coordinates" });
  try {
    const response = await axios.post(
      "https://valhalla1.openstreetmap.de/route",
      {
        locations: [
          { lon: parseFloat(fromLon), lat: parseFloat(fromLat) },
          { lon: parseFloat(toLon), lat: parseFloat(toLat) },
        ],
        costing: "pedestrian",
        units: "km",
      },
      { httpsAgent, timeout: 10000 }
    );
    const leg = response.data.trip.legs[0];
    res.json({
      coords: decodePolyline6(leg.shape),
      distance: Math.round(leg.summary.length * 1000),
      duration: Math.ceil(leg.summary.time / 60),
    });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

app.post("/api/analytics/click", (req, res) => {
  const { operatorId, operatorName, vehicleId, action, distanceMeters } = req.body;
  if (!operatorId || !action) return res.status(400).json({ error: "Missing fields" });
  record({ operatorId, operatorName, vehicleId, action, distanceMeters });
  res.json({ ok: true });
});

app.post("/api/analytics/entrance", (req, res) => {
  record({ action: "app_entrance" });
  res.json({ ok: true });
});

app.get("/api/analytics", (_req, res) => {
  res.json(summary());
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
