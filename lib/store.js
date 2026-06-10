const fs = require('fs');
const path = require('path');
const os = require('os');

const STORE_PATH = process.env.TEMPO_STORE_PATH || path.join(os.homedir(), '.tempo.json');

/**
 * Load state from ~/.tempo.json.
 * Returns { running: { task, startedAt } | null, totals: { [task]: millis } }
 * If the file doesn't exist (ENOENT), returns empty state.
 */
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

/**
 * Save state to ~/.tempo.json.
 * @param {object} state - { running: { task, startedAt } | null, totals: { [task]: millis } }
 */
function save(state) {
  const json = JSON.stringify(state, null, 2);
  fs.writeFileSync(STORE_PATH, json, 'utf8');
}

module.exports = { load, save };
