const fs = require('fs');
const path = require('path');
const os = require('os');

const STATE_FILE = path.join(os.homedir(), '.tempo.json');

function readState() {
  try {
    const data = fs.readFileSync(STATE_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return { tasks: {}, activeTimer: null };
    }
    throw err;
  }
}

function writeState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
}

function getTasks() {
  const state = readState();
  return state.tasks || {};
}

function getActiveTimer() {
  const state = readState();
  return state.activeTimer || null;
}

module.exports = {
  readState,
  writeState,
  getTasks,
  getActiveTimer,
};
