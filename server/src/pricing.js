const axios = require("axios");
const https = require("https");

const httpsAgent = new https.Agent({ rejectUnauthorized: false });
let cache = { data: null, expiresAt: 0 };
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 min — pricing rarely changes

async function fetchDottPricing() {
  if (cache.data && cache.expiresAt > Date.now()) return cache.data;

  const res = await axios.get(
    "https://gbfs.api.ridedott.com/public/v2/tel-aviv/system_pricing_plans.json",
    { httpsAgent, timeout: 6000 }
  );
  const plan = res.data?.data?.plans?.[0];
  if (!plan) return null;

  const result = {
    currency: plan.currency,
    unlockFee: plan.price,
    perMinute: plan.per_min_pricing?.[0]?.rate ?? null,
  };
  cache = { data: result, expiresAt: Date.now() + CACHE_TTL_MS };
  return result;
}

async function fetchAllPricing(operators) {
  const pricing = {};
  for (const op of operators) {
    try {
      if (op.id === "dott") pricing[op.id] = await fetchDottPricing();
    } catch {
      pricing[op.id] = null;
    }
  }
  return pricing;
}

module.exports = { fetchAllPricing };
