const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "..", "analytics.json");

function load() {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    return [];
  }
}

function record(event) {
  const events = load();
  events.push({ ...event, timestamp: new Date().toISOString() });
  fs.writeFileSync(FILE, JSON.stringify(events, null, 2));
}

function summary() {
  const events = load();
  const byOperator = {};
  for (const e of events) {
    if (!byOperator[e.operatorId]) {
      byOperator[e.operatorId] = { operatorId: e.operatorId, operatorName: e.operatorName, clicks: 0, actions: {} };
    }
    byOperator[e.operatorId].clicks++;
    byOperator[e.operatorId].actions[e.action] = (byOperator[e.operatorId].actions[e.action] || 0) + 1;
  }
  return {
    total: events.length,
    byOperator: Object.values(byOperator).sort((a, b) => b.clicks - a.clicks),
    recent: events.slice(-20).reverse(),
  };
}

module.exports = { record, summary };
