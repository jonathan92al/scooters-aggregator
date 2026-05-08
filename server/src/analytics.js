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

const RECENT_ACTIONS = new Set(["app_entrance", "ride_now", "take_me_there"]);

function summary() {
  const events = load();
  const byOperator = {};
  let entrances = 0;

  for (const e of events) {
    if (e.action === "app_entrance") { entrances++; continue; }
    if (!byOperator[e.operatorId]) {
      byOperator[e.operatorId] = { operatorId: e.operatorId, operatorName: e.operatorName, clicks: 0, actions: {} };
    }
    byOperator[e.operatorId].clicks++;
    byOperator[e.operatorId].actions[e.action] = (byOperator[e.operatorId].actions[e.action] || 0) + 1;
  }

  const recent = events
    .filter((e) => RECENT_ACTIONS.has(e.action))
    .slice(-20)
    .reverse();

  return {
    total: events.length,
    entrances,
    byOperator: Object.values(byOperator).sort((a, b) => b.clicks - a.clicks),
    recent,
  };
}

module.exports = { record, summary };
