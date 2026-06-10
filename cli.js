#!/usr/bin/env node
// tempo — tiny task timer CLI.

const store = require('./lib/store');
const cmd = process.argv[2];

function start(task) {
  if (!task) {
    console.error('usage: tempo start <task>');
    process.exit(1);
  }
  const state = store.load();
  state.running = { task, startedAt: Date.now() };
  store.save(state);
  console.log(`started timing: ${task}`);
}

function stop() {
  const state = store.load();
  if (!state.running) {
    console.error('no timer is running');
    process.exit(1);
  }
  const elapsed = Date.now() - state.running.startedAt;
  const task = state.running.task;
  state.totals[task] = (state.totals[task] || 0) + elapsed;
  state.running = null;
  store.save(state);
  console.log(`stopped timing: ${task} (${formatDuration(elapsed)})`);
}

function list() {
  const state = store.load();
  const tasks = Object.keys(state.totals);
  if (tasks.length === 0) {
    console.log('no tasks recorded');
    return;
  }
  console.log('task totals:');
  for (const task of tasks) {
    console.log(`  ${task}: ${formatDuration(state.totals[task])}`);
  }
}

function reset() {
  const state = { running: null, totals: {} };
  store.save(state);
  console.log('all data cleared');
}

function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}

switch (cmd) {
  case 'start':
    start(process.argv[3]);
    break;
  case 'stop':
    stop();
    break;
  case 'list':
    list();
    break;
  case 'reset':
    reset();
    break;
  default:
    console.error('usage: tempo <start|stop|list|reset>');
    process.exit(1);
}
