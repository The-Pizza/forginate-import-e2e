# tempo — a tiny task timer CLI

A minimal command-line time tracker. You start a timer for a task, stop it, and view totals.

## Commands

- `tempo start <task>` — begin timing a task
- `tempo stop` — stop the running timer and record the elapsed time
- `tempo list` — display cumulative time spent on each task
- `tempo reset` — clear all recorded task data

State persists between runs in `~/.tempo.json`.
