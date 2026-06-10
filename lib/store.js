// State persistence for tempo CLI
// Manages ~/.tempo.json with schema: { running: {task, startedAt}, totals: {task: ms} }

const fs = require('fs');
const path = require('path');
const os = require('os');

// Try ~/.tempo.json first, fall back to /tmp if home is read-only (e.g. CI)
function getStorePath() {
  if (process.env.TEMPO_STORE) {
    return process.env.TEMPO_STORE;
  }
  const homeStore = path.join(os.homedir(), '.tempo.json');
  try {
    // Test writability
    fs.accessSync(os.homedir(), fs.constants.W_OK);
    return homeStore;
  } catch {
    // Home is read-only, use temp dir
    return path.join(os.tmpdir(), 'tempo.json');
  }
}

const STORE_PATH = getStorePath();

function load() {
  try {
    const raw = fs.readFileSync(STORE_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return { running: null, totals: {} };
    }
    throw err;
  }
}

function save(state) {
  fs.writeFileSync(STORE_PATH, JSON.stringify(state, null, 2), 'utf8');
}

function startTask(task) {
  const state = load();
  state.running = { task, startedAt: Date.now() };
  save(state);
}

function stopTask() {
  const state = load();
  if (!state.running) {
    return null;
  }
  
  const { task, startedAt } = state.running;
  const elapsed = Date.now() - startedAt;
  
  state.totals[task] = (state.totals[task] || 0) + elapsed;
  state.running = null;
  save(state);
  
  return { task, elapsed };
}

function getTotals() {
  const state = load();
  return state.totals;
}

function reset() {
  save({ running: null, totals: {} });
}

module.exports = {
  startTask,
  stopTask,
  getTotals,
  reset,
};
