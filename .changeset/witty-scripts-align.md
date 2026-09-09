---
'repobuddy': minor
---

New `buddy test-scripts` command: adds or adjusts a project's `test`, `coverage`, and `test:watch`
scripts to match the test runner it actually uses.

The runner is read off the project's dependencies — `jest` or `@repobuddy/jest` means jest, `vitest`
or `@repobuddy/vitest` means vitest — and `--runner` names it when a project depends on both or on
neither. `--cwd` points the command at a project other than the working directory.

Adjusting never clobbers a script the project meant to keep. A missing script is added; a script
still holding one of the values this command writes, for either runner, is adjusted; anything else is
left alone and reported as skipped. That makes a second run a no-op and lets a project that moved
from jest to vitest pick up the new commands without losing a customized `test`. The manifest keeps
its own indentation and script order — only the managed keys are touched.

This is the CLI's first authored command, so it also settles the shape the ones after it follow:
detect from the project, report every script as added, adjusted, or skipped, and be safe to run twice.
