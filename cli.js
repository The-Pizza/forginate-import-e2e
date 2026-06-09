#!/usr/bin/env node
// tempo — tiny task timer CLI.
// NOTE: only `start` is implemented. stop / list / reset are stubs — the
// README promises them but the code does not deliver, which is exactly the
// gap the audit should detect and gap-closing should fill.

const cmd = process.argv[2];

function start(task) {
  if (!task) {
    console.error('usage: tempo start <task>');
    process.exit(1);
  }
  console.log(`started timing: ${task}`);
  // TODO: persist start time to ~/.tempo.json
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
