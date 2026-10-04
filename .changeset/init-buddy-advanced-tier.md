---
"repobuddy": minor
---

`init-buddy` adds an opt-in advanced tier to its allow list, for Claude Code. It is offered only when the user asks, and each entry is written only together with its guard. `Bash(gh pr merge --auto *)` is offered only when the default branch requires a status check, because with none `--auto` merges at once. It is written together with the `gh pr merge --admin` deny entries. `gh api` reads are allowed in one of two ways: a read-only token for one session, or the new `gh-api-guard` PreToolUse hook that ships with the skill (`scripts/gh-api-guard.mjs`). The hook allows GET requests and GraphQL queries with no `mutation`. It asks for everything else, including fields that switch to POST, `--input`, `@file` fields, pipes, and variables.
