const axios = require("axios");
const https = require("https");

// Some operators (Bird, Lime) use certs with chain validation issues on certain networks.
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

const cache = {};
const CACHE_TTL_MS = 30_000;

async function fetchJson(url) {
  const res = await axios.get(url, { timeout: 8000, httpsAgent });
  return res.data;
}

async function fetchVehiclesForOperator(operator) {
  const cached = cache[operator.id];
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const gbfsUrl = `${operator.gbfsBase}/gbfs.json`;
  let freeBikeStatusUrl;

  try {
    const gbfs = await fetchJson(gbfsUrl);
    const feeds = gbfs?.data?.en?.feeds || gbfs?.data?.feeds || [];
    const bikeStatusFeed = feeds.find((f) => f.name === "free_bike_status");
    freeBikeStatusUrl = bikeStatusFeed?.url;
  } catch {
    freeBikeStatusUrl = `${operator.gbfsBase}/free_bike_status.json`;
  }

  const bikeStatus = await fetchJson(freeBikeStatusUrl);
  const bikes = bikeStatus?.data?.bikes || [];

  const vehicles = bikes
    .filter((bike) => !bike.is_disabled && !bike.is_reserved)
    .map((bike) => ({
      id: `${operator.id}-${bike.bike_id}`,
      operatorId: operator.id,
      operatorName: operator.name,
      color: operator.color,
      website: operator.website,
      lat: bike.lat,
      lon: bike.lon,
      batteryPercent: bike.current_fuel_percent != null
        ? Math.min(100, Math.round(bike.current_fuel_percent * 100))
        : bike.current_range_meters != null
        ? Math.min(100, Math.round((bike.current_range_meters / 25000) * 100))
        : null,
      deepLink: bike.rental_uris?.android || bike.rental_uris?.ios || null,
    }));

  cache[operator.id] = { data: vehicles, expiresAt: Date.now() + CACHE_TTL_MS };
  return vehicles;
}

async function fetchAllVehicles(operators) {
  const results = await Promise.allSettled(
    operators.map((op) => fetchVehiclesForOperator(op))
  );

  const vehicles = [];
  const errors = [];

  results.forEach((result, i) => {
    if (result.status === "fulfilled") {
      vehicles.push(...result.value);
    } else {
      errors.push({ operator: operators[i].id, error: result.reason?.message });
    }
  });

  return { vehicles, errors };
}

module.exports = { fetchAllVehicles };
