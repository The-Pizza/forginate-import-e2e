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
  console.error('list: not implemented');
  process.exit(2);
}

function reset() {
  console.error('reset: not implemented');
  process.exit(2);
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
