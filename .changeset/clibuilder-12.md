---
"repobuddy": minor
"@repobuddy/typescript": minor
---

Moves to clibuilder 12. The `buddy` CLI keeps its commands, arguments, and flags, and still loads plugins from the repobuddy config (now through `@clibuilder/plugins`, so `buddy ts build` and `buddy ts copy-cjs-package-json` still work). What changes is how it prints and fails:

- `buddy test-scripts` and `buddy check-deps` print their answer on stdout in clibuilder's default `toon` format, and no longer log it as lines. Pass `--format text` for the lines they printed before; `--format json` for JSON.
- Progress and warnings go to stderr: `buddy ts build` and `buddy ts copy-cjs-package-json` write their progress lines there instead of stdout.
- A usage error (an unknown flag, a bad `--runner` value, a missing argument) is now a coded report on stdout with exit code 2. It used to be prose with the full help on stderr.
- `--format <toon|json|text>` is accepted by every command, and `--help` answers on stdout in that format (`--format text` for the old help).
- `--show-config` answers on stdout in `toon` by default; pass `--format text` for the old lines.
- `repobuddy` now depends on `args-minus`, so a plugin's commands and the CLI share one copy of it.
- `@repobuddy/typescript` depends on `clibuilder` `^12.0.0` (was `^11.3.3`). A plugin command written for the 11 `activate(cli)` hook still loads.
