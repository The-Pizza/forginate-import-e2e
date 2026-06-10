#!/usr/bin/env node
// Wrapper to run tests, ignoring unknown flags like --silent
const { spawn } = require('child_process');

// Filter out flags we want to ignore
const args = process.argv.slice(2).filter(arg => arg !== '--silent');

const child = spawn('node', ['--test', ...args], { stdio: 'inherit' });
child.on('exit', code => process.exit(code));
