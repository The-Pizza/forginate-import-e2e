# tempo — a tiny task timer CLI

A minimal command-line time tracker. You start a timer for a task, stop it, and
list how long you spent on each task.

## Commands

- `tempo start <task>` — begin timing a task
- `tempo stop` — stop the running timer and record the elapsed time
- `tempo list` — show total time logged per task
- `tempo reset` — clear all recorded times

State persists between runs in `~/.tempo.json`.
