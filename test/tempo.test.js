#!/usr/bin/env node

const { test } = require('node:test');
const assert = require('node:assert');
const { execSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

// Helper to create isolated temp HOME for each test
function withTempHome(fn) {
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'tempo-test-'));
  const originalHome = process.env.HOME;
  try {
    process.env.HOME = tempHome;
    fn(tempHome);
  } finally {
    process.env.HOME = originalHome;
    fs.rmSync(tempHome, { recursive: true, force: true });
  }
}

// Helper to run tempo CLI command
function runTempo(args, env = {}) {
  const result = spawnSync('node', ['./cli.js', ...args], {
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
  return {
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    exitCode: result.status,
  };
}

// Helper to read state file
function readState(tempHome) {
  const statePath = path.join(tempHome, '.tempo.json');
  if (!fs.existsSync(statePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(statePath, 'utf8'));
}

// Helper to write state file
function writeState(tempHome, state) {
  const statePath = path.join(tempHome, '.tempo.json');
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf8');
}

test('start command writes state', (t) => {
  withTempHome((tempHome) => {
    const result = runTempo(['start', 'coding'], { HOME: tempHome });
    
    assert.strictEqual(result.exitCode, 0, 'start should exit 0');
    
    const state = readState(tempHome);
    assert.ok(state, 'state file should exist');
    assert.ok(state.activeTimer, 'activeTimer should be set');
    assert.strictEqual(state.activeTimer.task, 'coding', 'task name should be "coding"');
    assert.ok(state.activeTimer.startTime, 'startTime should be set');
    
    // Verify timestamp is recent (within last 5 seconds)
    const startTime = new Date(state.activeTimer.startTime);
    const now = new Date();
    const diff = now - startTime;
    assert.ok(diff >= 0 && diff < 5000, 'startTime should be within last 5 seconds');
  });
});

test('start with no task name exits 1', (t) => {
  withTempHome((tempHome) => {
    const result = runTempo(['start'], { HOME: tempHome });
    
    assert.strictEqual(result.exitCode, 1, 'start without task should exit 1');
    assert.ok(result.stderr.includes('usage'), 'stderr should contain usage message');
  });
});

test('double-start policy: second start stops first', (t) => {
  withTempHome((tempHome) => {
    // Start first task
    runTempo(['start', 'task1'], { HOME: tempHome });
    
    // Wait a bit
    const delay = (ms) => execSync(`sleep ${ms / 1000}`, { stdio: 'ignore' });
    delay(100);
    
    // Start second task
    const result = runTempo(['start', 'task2'], { HOME: tempHome });
    assert.strictEqual(result.exitCode, 0, 'second start should succeed');
    
    const state = readState(tempHome);
    assert.strictEqual(state.activeTimer.task, 'task2', 'activeTimer should be task2');
    assert.ok(state.tasks && state.tasks.task1 > 0, 'task1 should have recorded time');
  });
});

test('stop computes duration and clears running timer', (t) => {
  withTempHome((tempHome) => {
    // Start a task
    runTempo(['start', 'development'], { HOME: tempHome });
    
    // Wait 200ms
    const delay = (ms) => execSync(`sleep ${ms / 1000}`, { stdio: 'ignore' });
    delay(200);
    
    // Stop the task
    const result = runTempo(['stop'], { HOME: tempHome });
    assert.strictEqual(result.exitCode, 0, 'stop should exit 0');
    
    const state = readState(tempHome);
    assert.strictEqual(state.activeTimer, null, 'activeTimer should be cleared');
    assert.ok(state.tasks, 'tasks object should exist');
    assert.ok(state.tasks.development >= 100, 'development should have at least 100ms recorded');
    assert.ok(state.tasks.development < 1000, 'development should have less than 1000ms recorded');
  });
});

test('stop without running timer exits with error', (t) => {
  withTempHome((tempHome) => {
    const result = runTempo(['stop'], { HOME: tempHome });
    
    assert.notStrictEqual(result.exitCode, 0, 'stop without active timer should exit non-zero');
    assert.ok(result.stderr.length > 0, 'stderr should contain error message');
  });
});

test('list output shows tasks', (t) => {
  withTempHome((tempHome) => {
    // Pre-populate state with some tasks
    writeState(tempHome, {
      activeTimer: null,
      tasks: {
        coding: 3600000,    // 1 hour
        review: 1800000,    // 30 minutes
        meeting: 7200000,   // 2 hours
      },
    });
    
    const result = runTempo(['list'], { HOME: tempHome });
    assert.strictEqual(result.exitCode, 0, 'list should exit 0');
    
    // Verify all tasks appear in output
    assert.ok(result.stdout.includes('coding'), 'output should include "coding"');
    assert.ok(result.stdout.includes('review'), 'output should include "review"');
    assert.ok(result.stdout.includes('meeting'), 'output should include "meeting"');
    
    // Verify human-readable time formatting (should show hours/minutes)
    assert.ok(
      result.stdout.match(/1\s*h/) || result.stdout.includes('1:00') || result.stdout.includes('60m'),
      'output should show human-readable time for coding (1h)'
    );
  });
});

test('list with no data shows empty state', (t) => {
  withTempHome((tempHome) => {
    const result = runTempo(['list'], { HOME: tempHome });
    
    assert.strictEqual(result.exitCode, 0, 'list should exit 0 even with no data');
    // Should show either empty output or a message indicating no tasks
    assert.ok(
      result.stdout.length === 0 || 
      result.stdout.includes('No tasks') || 
      result.stdout.includes('no tasks'),
      'output should indicate no tasks tracked'
    );
  });
});

test('reset clears state file', (t) => {
  withTempHome((tempHome) => {
    // Pre-populate state
    writeState(tempHome, {
      activeTimer: { task: 'ongoing', startTime: new Date().toISOString() },
      tasks: {
        task1: 5000,
        task2: 10000,
      },
    });
    
    const result = runTempo(['reset'], { HOME: tempHome });
    assert.strictEqual(result.exitCode, 0, 'reset should exit 0');
    
    const state = readState(tempHome);
    assert.ok(state, 'state file should still exist');
    assert.strictEqual(state.activeTimer, null, 'activeTimer should be cleared');
    assert.ok(!state.tasks || Object.keys(state.tasks).length === 0, 'tasks should be empty');
  });
});

test('persistence across separate invocations', (t) => {
  withTempHome((tempHome) => {
    // First invocation: start a task
    const start1 = runTempo(['start', 'analysis'], { HOME: tempHome });
    assert.strictEqual(start1.exitCode, 0);
    
    // Read state to verify
    const state1 = readState(tempHome);
    assert.strictEqual(state1.activeTimer.task, 'analysis');
    const originalStartTime = state1.activeTimer.startTime;
    
    // Second invocation: verify state persisted
    const state2 = readState(tempHome);
    assert.strictEqual(state2.activeTimer.task, 'analysis');
    assert.strictEqual(state2.activeTimer.startTime, originalStartTime);
    
    // Third invocation: stop
    const delay = (ms) => execSync(`sleep ${ms / 1000}`, { stdio: 'ignore' });
    delay(100);
    
    const stop = runTempo(['stop'], { HOME: tempHome });
    assert.strictEqual(stop.exitCode, 0);
    
    // Fourth invocation: list
    const list = runTempo(['list'], { HOME: tempHome });
    assert.strictEqual(list.exitCode, 0);
    assert.ok(list.stdout.includes('analysis'), 'list should show analysis task');
  });
});

test('unknown command shows usage and exits 1', (t) => {
  withTempHome((tempHome) => {
    const result = runTempo(['invalidcommand'], { HOME: tempHome });
    
    assert.strictEqual(result.exitCode, 1, 'unknown command should exit 1');
    assert.ok(
      result.stderr.includes('usage') || result.stderr.includes('tempo'),
      'stderr should show usage or mention tempo'
    );
  });
});

test('no command shows usage and exits 1', (t) => {
  withTempHome((tempHome) => {
    const result = runTempo([], { HOME: tempHome });
    
    assert.strictEqual(result.exitCode, 1, 'no command should exit 1');
    assert.ok(result.stderr.length > 0, 'stderr should contain usage message');
  });
});

test('time aggregation across multiple sessions', (t) => {
  withTempHome((tempHome) => {
    const delay = (ms) => execSync(`sleep ${ms / 1000}`, { stdio: 'ignore' });
    
    // First session
    runTempo(['start', 'analysis'], { HOME: tempHome });
    delay(100);
    runTempo(['stop'], { HOME: tempHome });
    
    const state1 = readState(tempHome);
    const firstDuration = state1.tasks.analysis;
    assert.ok(firstDuration >= 50, 'first session should record some time');
    
    // Second session
    runTempo(['start', 'analysis'], { HOME: tempHome });
    delay(150);
    runTempo(['stop'], { HOME: tempHome });
    
    const state2 = readState(tempHome);
    const totalDuration = state2.tasks.analysis;
    assert.ok(totalDuration > firstDuration, 'second session should add to total');
    assert.ok(totalDuration >= 200, 'total should be at least 200ms');
  });
});

test('state file creation on first use', (t) => {
  withTempHome((tempHome) => {
    const statePath = path.join(tempHome, '.tempo.json');
    
    // Verify state file doesn't exist
    assert.strictEqual(fs.existsSync(statePath), false, 'state file should not exist initially');
    
    // Run start command
    runTempo(['start', 'first-task'], { HOME: tempHome });
    
    // Verify state file was created
    assert.strictEqual(fs.existsSync(statePath), true, 'state file should be created');
    
    const state = readState(tempHome);
    assert.ok(state.activeTimer, 'state should have activeTimer');
    assert.strictEqual(state.activeTimer.task, 'first-task');
  });
});
