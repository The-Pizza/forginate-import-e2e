#!/usr/bin/env node
// tempo — tiny task timer CLI.
// NOTE: only `start` is implemented. stop / list / reset are stubs — the
// README promises them but the code does not deliver, which is exactly the
// gap the audit should detect and gap-closing should fill.

const fs = require('fs');
const os = require('os');
const path = require('path');

const cmd = process.argv[2];
const STATE_FILE = path.join(os.homedir(), '.tempo.json');

function readState() {
  try {
    const data = fs.readFileSync(STATE_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return { tasks: {} };
    }
    throw err;
  }
}

function writeState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
}

function start(task) {
  if (!task) {
    console.error('usage: tempo start <task>');
    process.exit(1);
  }
  
  const state = readState();
  
  // Double-start policy: reject if a timer is already running
  if (state.running) {
    console.error(`error: timer already running for task '${state.running.task}'`);
    console.error('stop the current timer before starting a new one');
    process.exit(1);
  }
  
  state.running = {
    task: task,
    startedAt: Date.now()
  };
  
  writeState(state);
  console.log(`started timing: ${task}`);
}

switch (cmd) {
  case 'start':
    start(process.argv[3]);
    break;
  case 'stop':
  case 'list':
  case 'reset':
    console.error(`'${cmd}' is not implemented yet`);
    process.exit(2);
  default:
    console.error('usage: tempo <start|stop|list|reset>');
    process.exit(1);
}
