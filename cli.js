#!/usr/bin/env node
// tempo — tiny task timer CLI.

const store = require('./lib/store');

const cmd = process.argv[2];

function start(task) {
  if (!task) {
    console.error('usage: tempo start <task>');
    process.exit(1);
  }
  store.startTask(task);
  console.log(`started timing: ${task}`);
}

function stop() {
  const result = store.stopTask();
  if (!result) {
    console.error('no active timer');
    process.exit(1);
  }
  const seconds = Math.round(result.elapsed / 1000);
  console.log(`stopped ${result.task}: ${seconds}s`);
}

function list() {
  const totals = store.getTotals();
  const tasks = Object.keys(totals).sort();
  
  if (tasks.length === 0) {
    console.log('no tasks recorded');
    return;
  }
  
  for (const task of tasks) {
    const ms = totals[task];
    const formatted = formatDuration(ms);
    console.log(`${task}: ${formatted}`);
  }
}

function reset() {
  store.reset();
  console.log('all data cleared');
}

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000) % 60;
  const minutes = Math.floor(ms / 1000 / 60) % 60;
  const hours = Math.floor(ms / 1000 / 60 / 60);
  
  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0) parts.push(`${seconds}s`);
  
  return parts.length > 0 ? parts.join(' ') : '0s';
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
