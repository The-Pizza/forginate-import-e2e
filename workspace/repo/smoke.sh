#!/bin/bash
# Smoke test for Task 12: list and reset are documented and implemented

set -e

# Check that README advertises all four commands
if ! grep -q "tempo start" README.md; then
  echo "FAIL: README does not advertise 'tempo start'"
  exit 1
fi

if ! grep -q "tempo stop" README.md; then
  echo "FAIL: README does not advertise 'tempo stop'"
  exit 1
fi

if ! grep -q "tempo list" README.md; then
  echo "FAIL: README does not advertise 'tempo list'"
  exit 1
fi

if ! grep -q "tempo reset" README.md; then
  echo "FAIL: README does not advertise 'tempo reset'"
  exit 1
fi

# Check that README mentions state persistence
if ! grep -q "State persists" README.md; then
  echo "FAIL: README does not mention state persistence"
  exit 1
fi

# Check that start, stop, list, and reset work
TEMPO_STORE=$(mktemp)
export TEMPO_STORE

# Initialize the store with empty state
echo '{"running": null, "totals": {}}' > "$TEMPO_STORE"

# Test start command
node cli.js start "test-task" > /dev/null
if [ $? -ne 0 ]; then
  echo "FAIL: 'tempo start' failed"
  exit 1
fi

# Test stop command
node cli.js stop > /dev/null
if [ $? -ne 0 ]; then
  echo "FAIL: 'tempo stop' failed"
  exit 1
fi

# Test list command
output=$(node cli.js list)
if [ $? -ne 0 ]; then
  echo "FAIL: 'tempo list' failed"
  exit 1
fi

# Verify list output contains the task
if ! echo "$output" | grep -q "test-task"; then
  echo "FAIL: 'tempo list' did not show test-task"
  echo "Output was: $output"
  exit 1
fi

# Test reset command
node cli.js reset > /dev/null
if [ $? -ne 0 ]; then
  echo "FAIL: 'tempo reset' failed"
  exit 1
fi

# Verify list is empty after reset
output=$(node cli.js list)
if ! echo "$output" | grep -q "no tasks recorded"; then
  echo "FAIL: 'tempo list' did not show 'no tasks recorded' after reset"
  echo "Output was: $output"
  exit 1
fi

rm -f "$TEMPO_STORE"

echo "PASS: All four commands documented and working"
exit 0
