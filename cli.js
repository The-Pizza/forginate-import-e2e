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
  const tasks = Object.keys(totals);
  
  if (tasks.length === 0) {
    console.log('no tasks recorded');
    return;
  }
  
  tasks.forEach(task => {
    const ms = totals[task];
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    const h = hours;
    const m = minutes % 60;
    const s = seconds % 60;
    
    let duration;
    if (h > 0) {
      duration = `${h}h ${m}m ${s}s`;
    } else if (m > 0) {
      duration = `${m}m ${s}s`;
    } else {
      duration = `${s}s`;
    }
    
    console.log(`${task}: ${duration}`);
  });
}

function reset() {
  store.reset();
  console.log('all task data cleared');
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
