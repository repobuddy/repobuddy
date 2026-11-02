---
"repobuddy": minor
---

`init-buddy` runs two scripts for its permission steps, so they come out the same every run. `scripts/permission-candidates.mjs` lists the allow and deny candidates for the detected hosts, the package managers on PATH, the repo's scripts, and whether it uses Changesets, leaving out entries the user already has. `scripts/auto-mode.mjs` covers the auto-mode step: `check` reads the current settings and flags template text, `discover` asks `gh` for the user's namespaces, their visibility, and the repo's branch rules, `render` words the environment entries and `autoMode.allow` rules, and `apply` appends them to `~/.claude/settings.json` with their deny entries, only on `--write`. Both scripts are committed with the skill, so a git install has them.
