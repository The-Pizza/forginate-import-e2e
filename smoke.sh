#!/bin/bash
# Smoke test for Task 11: README advertises commands that are stubs

set -e

# Check that README does NOT advertise list or reset
if grep -q "tempo list" README.md; then
  echo "FAIL: README still advertises 'tempo list' (stub command)"
  exit 1
fi

if grep -q "tempo reset" README.md; then
  echo "FAIL: README still advertises 'tempo reset' (stub command)"
  exit 1
fi

# Check that README DOES advertise start and stop
if ! grep -q "tempo start" README.md; then
  echo "FAIL: README does not advertise 'tempo start'"
  exit 1
fi

if ! grep -q "tempo stop" README.md; then
  echo "FAIL: README does not advertise 'tempo stop'"
  exit 1
fi

# Check that README mentions state persistence
if ! grep -q "State persists" README.md; then
  echo "FAIL: README does not mention state persistence"
  exit 1
fi

# Check that start and stop actually work
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

rm -f "$TEMPO_STORE"

echo "PASS: README only advertises implemented commands (start, stop)"
exit 0
