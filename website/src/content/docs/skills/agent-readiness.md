---
title: agent-readiness
description: Score how ready a repo or package is for coding agents, fix the findings one area at a time, and benchmark agent cost.
---

`agent-readiness` reports a gated level from 1 to 5 and the three fixes worth the most, then can apply fixes as
reviewable commits or benchmark what agents cost in the repo.

## When to use

- "is this repo agent-ready?" or "why do agents struggle in this repo?"
- "how many tokens does every session load before it starts?"
- "fix what the readiness score found"
- "did that change make agents cheaper?"
- Before you hand a repository to unattended agents.

## Invoke

Run `/agent-readiness <subcommand>`, or ask in plain words.

| Subcommand | What it does |
| --- | --- |
| `score [--dir <repo>]` | Static scan plus judgment calls. Reports the level, ranked fixes, tokens loaded per session, and the prompt-injection surface. |
| `score --package <path>` | Scores how cheaply an agent in another repo can use a package (levels 1 to 4). Reads types, `exports`, README, changelog, `llms.txt`. |
| `score --check [--min-level <n>]` | Exits 1 when the level is below `n` (default 3; 1 to 4 with `--package`). For CI. Judgment gates count as unknown, so the result is provisional. |
| `score --json`, `--run-knip` | Machine-readable output; run knip from the script. |
| `improve [area]` | Proposes each fix, applies it only on your yes, runs the verify command, and commits one area per commit. Needs a clean working tree. |
| `bench` | Prints the plan, estimated spend, and spend ceiling. Runs nothing. |
| `bench --init` | Writes a task-set template to `.agents/readiness/bench/tasks.json`. |
| `bench --yes [--baseline]` | Runs the tasks. `--baseline` records `baseline.json`; otherwise it compares against it. |
| `bench --runs <n>`, `--task <id>`, `--ref <commit>`, `--runner print\|interactive` | Run count, one task, a past commit, or interactive Claude Code sessions in tmux or herdr. |
| `bench compare <before.json> <after.json>` | Compares two stored results with spread and permutation p-values. Free. |

## The scope check

`instructions-scope` (level 3, not a gate) asks whether the instructions file says what the project is for and what
it is not. The script looks for a scope, purpose, or non-goals statement in the instructions file or in a local file
it names. It fails when nothing states the boundary, or when a well-known scope file such as `GOALS.md`, `SCOPE.md`,
or `VISION.md` exists but no instructions file names it. When it finds a statement, the agent judges whether the
boundary is specific enough to turn down a real change.

## What it produces or changes

- `score` changes nothing.
- `improve` makes one commit per area. For a missing scope statement it drafts 2 to 4 lines of purpose and boundary
  for `AGENTS.md` and a `GOALS.md` (goals, non-goals, rejected directions) from the README. You decide every boundary. Optional `.agents/readiness/weights.json` reorders fixes but never changes the level.
- `bench` writes results under `.agents/readiness/bench/` (transcripts gzipped, git-ignored).

## Asks before acting

- `improve`: each fix, individually.
- `bench`: shows the plan and spend, and runs only after a yes. Defaults: Sonnet, 3 runs per task, $0.50 cap per run.
- A committed secret: asks you to rotate it before it untracks the file.

## Hands off to

[`buddy-agent-harness`](https://github.com/repobuddy/buddy-agent-harness) for instructions and harness config,
[`llms-txt`](/repobuddy/skills/llms-txt/), [`review-permissions`](/repobuddy/skills/review-permissions/),
[`setup-github-repo`](/repobuddy/skills/setup-github-repo/), [`min-release-age`](/repobuddy/skills/min-release-age/),
and [`setup-npm-trusted-publishing`](/repobuddy/skills/setup-npm-trusted-publishing/).

## Requirements

- Node.js to run the script. Falls back to `npx -y repobuddy@^1.12.0 agent-readiness` (needs network). See
  [Skill scripts](/repobuddy/cli/skill-scripts/).
- `bench` needs the `claude` CLI. `--runner interactive` also needs `CLAUDE_CODE_OAUTH_TOKEN` or `ANTHROPIC_API_KEY`.

## Example

```
/agent-readiness score --check --min-level 3
```

More detail: [skill README](https://github.com/repobuddy/repobuddy/tree/main/packages/buddy/skills/agent-readiness).
