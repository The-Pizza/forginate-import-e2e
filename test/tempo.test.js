// Tests for tempo CLI
const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

// Helper to run tempo CLI commands
function runTempo(args, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', ['./cli.js', ...args], {
      env: { ...process.env, ...env },
      cwd: path.join(__dirname, '..')
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', data => { stdout += data; });
    child.stderr.on('data', data => { stderr += data; });

    child.on('close', code => {
      resolve({ code, stdout, stderr });
    });

    child.on('error', reject);
  });
}

// Helper to sleep
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('tempo CLI', () => {
  let testStoreDir;
  let testStorePath;

  beforeEach(() => {
    // Create a unique temp store for each test
    testStoreDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tempo-test-'));
    testStorePath = path.join(testStoreDir, 'tempo.json');
  });

  afterEach(() => {
    // Clean up test store
    if (fs.existsSync(testStorePath)) {
      fs.unlinkSync(testStorePath);
    }
    if (fs.existsSync(testStoreDir)) {
      fs.rmdirSync(testStoreDir);
    }
  });

  test('start creates a timer', async () => {
    const env = { TEMPO_STORE: testStorePath };
    const result = await runTempo(['start', 'test-task'], env);

    assert.strictEqual(result.code, 0);
    assert.match(result.stdout, /started timing: test-task/);

    // Verify store file was created
    assert.ok(fs.existsSync(testStorePath));

    const state = JSON.parse(fs.readFileSync(testStorePath, 'utf8'));
    assert.strictEqual(state.running.task, 'test-task');
    assert.ok(state.running.startedAt);
  });

  test('start without task name shows usage', async () => {
    const env = { TEMPO_STORE: testStorePath };
    const result = await runTempo(['start'], env);

    assert.strictEqual(result.code, 1);
    assert.match(result.stderr, /usage: tempo start <task>/);
  });

  test('start/stop round-trip records elapsed time', async () => {
    const env = { TEMPO_STORE: testStorePath };

    // Start timer
    const startResult = await runTempo(['start', 'coding'], env);
    assert.strictEqual(startResult.code, 0);

    // Wait a bit
    await sleep(100);

    // Stop timer
    const stopResult = await runTempo(['stop'], env);
    assert.strictEqual(stopResult.code, 0);
    assert.match(stopResult.stdout, /stopped coding:/);

    // Verify state
    const state = JSON.parse(fs.readFileSync(testStorePath, 'utf8'));
    assert.strictEqual(state.running, null);
    assert.ok(state.totals.coding > 0);
  });

  test('stop with no active timer returns error', async () => {
    const env = { TEMPO_STORE: testStorePath };

    const result = await runTempo(['stop'], env);
    assert.strictEqual(result.code, 1);
    assert.match(result.stderr, /no active timer/);
  });

  test('multiple start/stop sessions accumulate time', async () => {
    const env = { TEMPO_STORE: testStorePath };

    // First session
    await runTempo(['start', 'feature-x'], env);
    await sleep(50);
    await runTempo(['stop'], env);

    const state1 = JSON.parse(fs.readFileSync(testStorePath, 'utf8'));
    const firstElapsed = state1.totals['feature-x'];

    // Second session
    await runTempo(['start', 'feature-x'], env);
    await sleep(50);
    await runTempo(['stop'], env);

    const state2 = JSON.parse(fs.readFileSync(testStorePath, 'utf8'));
    const totalElapsed = state2.totals['feature-x'];

    // Total should be sum of both sessions
    assert.ok(totalElapsed > firstElapsed);
  });

  test('list with no data shows empty message', async () => {
    const env = { TEMPO_STORE: testStorePath };

    const result = await runTempo(['list'], env);
    assert.strictEqual(result.code, 0);
    assert.match(result.stdout, /no tasks recorded/);
  });

  test('list shows recorded tasks with human-readable durations', async () => {
    const env = { TEMPO_STORE: testStorePath };

    // Seed totals directly so we get a deterministic, readable format
    fs.writeFileSync(testStorePath, JSON.stringify({
      running: null,
      totals: {
        coding: 3661000,    // 1h 1m 1s
        review: 1800000,    // 30m
      }
    }));

    const result = await runTempo(['list'], env);
    assert.strictEqual(result.code, 0);
    assert.match(result.stdout, /coding: 1h 1m 1s/);
    assert.match(result.stdout, /review: 30m/);
  });

  test('list output is sorted by task name', async () => {
    const env = { TEMPO_STORE: testStorePath };

    fs.writeFileSync(testStorePath, JSON.stringify({
      running: null,
      totals: { zebra: 1000, alpha: 2000, mango: 3000 },
    }));

    const result = await runTempo(['list'], env);
    assert.strictEqual(result.code, 0);
    const alphaIdx = result.stdout.indexOf('alpha');
    const mangoIdx = result.stdout.indexOf('mango');
    const zebraIdx = result.stdout.indexOf('zebra');
    assert.ok(alphaIdx >= 0 && mangoIdx > alphaIdx && zebraIdx > mangoIdx,
      `expected alpha < mango < zebra, got: ${result.stdout}`);
  });

  test('reset clears all recorded data', async () => {
    const env = { TEMPO_STORE: testStorePath };

    // Seed some data
    fs.writeFileSync(testStorePath, JSON.stringify({
      running: { task: 'leftover', startedAt: Date.now() },
      totals: { foo: 1000, bar: 2000 },
    }));

    const resetResult = await runTempo(['reset'], env);
    assert.strictEqual(resetResult.code, 0);
    assert.match(resetResult.stdout, /all data cleared/);

    // Store should now be empty
    const state = JSON.parse(fs.readFileSync(testStorePath, 'utf8'));
    assert.strictEqual(state.running, null);
    assert.deepStrictEqual(state.totals, {});

    // And list should report no tasks
    const listResult = await runTempo(['list'], env);
    assert.strictEqual(listResult.code, 0);
    assert.match(listResult.stdout, /no tasks recorded/);
  });

  test('invalid command shows usage', async () => {
    const env = { TEMPO_STORE: testStorePath };

    const result = await runTempo(['invalid'], env);
    assert.strictEqual(result.code, 1);
    assert.match(result.stderr, /usage:/);
  });

  test('no command shows usage', async () => {
    const env = { TEMPO_STORE: testStorePath };

    const result = await runTempo([], env);
    assert.strictEqual(result.code, 1);
    assert.match(result.stderr, /usage:/);
  });
});
