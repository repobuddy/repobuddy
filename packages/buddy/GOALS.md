## Goals

- One package with two surfaces that share one version: the `buddy` CLI and an agent plugin with the repobuddy
  skills.
- A CLI command writes or checks repository config, or runs a script a skill uses. Plugins add more commands.
- A skill covers one repository chore and runs on Claude Code, Cursor, Codex, and GitHub Copilot CLI.

## Non-goals

- An importable API. The `exports` field names only `./package.json`.
- Runtime dependencies.
- Changeset authoring and security-PR remediation skills. They live in
  [repobuddy/agent-changesets](https://github.com/repobuddy/agent-changesets) and
  [repobuddy/agent-security](https://github.com/repobuddy/agent-security).

## Rejected directions

- **`check-deps` as a `postinstall` script.** It would run in every consumer's install, on a machine that did not
  ask for it: intrusive, and the shape a supply-chain review flags. Run it from `pretest` or CI.
