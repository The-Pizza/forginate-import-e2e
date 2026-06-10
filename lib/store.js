const fs = require('fs');
const path = require('path');
const os = require('os');

function getStorePath() {
  if (process.env.TEMPO_STORE_PATH) {
    return process.env.TEMPO_STORE_PATH;
  }
  
  // Try home directory first
  const homeStore = path.join(os.homedir(), '.tempo.json');
  
  // Test if home directory is writable by attempting to write
  // If not (e.g., in restricted environments), fall back to /tmp
  try {
    const testPath = path.join(os.homedir(), '.tempo-test-' + Date.now());
    fs.writeFileSync(testPath, '');
    fs.unlinkSync(testPath);
    return homeStore;
  } catch (err) {
    // Home is not writable, use /tmp instead
    return path.join('/tmp', '.tempo.json');
  }
}

const STORE_PATH = getStorePath();

function getEmptyState() {
  return { running: null, totals: {} };
}

function loadState() {
  if (!fs.existsSync(STORE_PATH)) {
    return getEmptyState();
  }
  const data = fs.readFileSync(STORE_PATH, 'utf8');
  return JSON.parse(data);
}

function reset() {
  const emptyState = getEmptyState();
  fs.writeFileSync(STORE_PATH, JSON.stringify(emptyState, null, 2), 'utf8');
}

function getTotals() {
  const state = loadState();
  return state.totals;
}

module.exports = {
  reset,
  getTotals,
};
