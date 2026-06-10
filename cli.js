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

function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

  return parts.join(' ');
}

function list() {
  const tasks = store.getTasks();
  const activeTimer = store.getActiveTimer();

  const taskNames = Object.keys(tasks);
  
  if (taskNames.length === 0 && !activeTimer) {
    console.log('No tasks recorded.');
    return;
  }

  taskNames.forEach(taskName => {
    const duration = formatDuration(tasks[taskName]);
    const indicator = (activeTimer && activeTimer.task === taskName) ? ' *' : '';
    console.log(`${taskName}\t${duration}${indicator}`);
  });

  // If there's an active timer for a task that has no logged time yet
  if (activeTimer && !tasks[activeTimer.task]) {
    console.log(`${activeTimer.task}\t0s *`);
  }
}

switch (cmd) {
  case 'start':
    start(process.argv[3]);
    break;
  case 'list':
    list();
    break;
  case 'stop':
  case 'reset':
    console.error(`'${cmd}' is not implemented yet`);
    process.exit(2);
  default:
    console.error('usage: tempo <start|stop|list|reset>');
    process.exit(1);
}
