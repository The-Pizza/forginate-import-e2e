#!/usr/bin/env node
// tempo — tiny task timer CLI.
// NOTE: only `start` is implemented. stop / list / reset are stubs — the
// README promises them but the code does not deliver, which is exactly the
// gap the audit should detect and gap-closing should fill.

const store = require('./lib/store');
const cmd = process.argv[2];

function start(task) {
  if (!task) {
    console.error('usage: tempo start <task>');
    process.exit(1);
  }
  console.log(`started timing: ${task}`);
  // TODO: persist start time to ~/.tempo.json
}

function list() {
  const totals = store.getTotals();
  const tasks = Object.keys(totals);
  
  if (tasks.length === 0) {
    console.log('No tasks recorded.');
    return;
  }
  
  for (const task of tasks) {
    const ms = totals[task];
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    const h = hours;
    const m = minutes % 60;
    const s = seconds % 60;
    
    const parts = [];
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    if (s > 0 || parts.length === 0) parts.push(`${s}s`);
    
    console.log(`${task}: ${parts.join(' ')}`);
  }
}

switch (cmd) {
  case 'start':
    start(process.argv[3]);
    break;
  case 'stop':
    console.error(`'${cmd}' is not implemented yet`);
    process.exit(2);
  case 'list':
    list();
    break;
  case 'reset':
    store.reset();
    console.log('All task times cleared.');
    break;
  default:
    console.error('usage: tempo <start|stop|list|reset>');
    process.exit(1);
}
