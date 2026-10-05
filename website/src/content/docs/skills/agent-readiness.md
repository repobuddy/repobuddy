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
| `bench` | Hands over to ACED's `bench` (or its engine, `npx -y -p cyber-aced@^0.3.0 aced-bench`) with the suite `repobuddy.readiness`: real agent runs, compared with permutation tests. |
| `bench convert <results.json> --arm <label>` | Converts an old `bench` results file into an ACED record, so ACED can re-read an old comparison. |
| `suggest [--area <id>]` | Suggests a weight override from ACED bench comparisons tagged `area=<id>`: a step of 5 on a replicated effect, else "keep the weight". Writes nothing. |

## The scope check

`instructions-scope` (level 3, not a gate) asks whether the instructions file says what the project is for and what
it is not. The script looks for a scope, purpose, or non-goals statement in the instructions file or in a local file
it names. It fails when nothing states the boundary, or when a well-known scope file such as `GOALS.md`, `SCOPE.md`,
or `VISION.md` exists but no instructions file names it. When it finds a statement, the agent judges whether the
boundary is specific enough to turn down a real change.

In a monorepo the check scores the root and each workspace package that is not `private`. The root passes on a
statement of what belongs in the repo, with no root `GOALS.md` expected. Each package passes on a `GOALS.md` (or
another scope file) inside it that its own `AGENTS.md` or the root instructions file names, or on a scope line in its
own `AGENTS.md`. Private packages, such as apps, the docs site, and test fixtures, are skipped. The check fails when the
root or any counted package fails, and lists which.

## What it produces or changes

- `score` changes nothing.
- `improve` makes one commit per area. For a missing scope statement it drafts 2 to 4 lines of purpose and boundary
  for `AGENTS.md` and a `GOALS.md` (goals, non-goals, rejected directions) from the README; in a monorepo, the root
  lines and one `GOALS.md` per failing package. You decide every boundary. An optional `## Weights` override in `.agents/references/repobuddy.readiness.md` reorders fixes but never changes the level.
- `bench` goes through ACED, which keeps the suite in `.agents/aced/bench/repobuddy.readiness/` (with the committed
  `baseline.json` level 5 reads) and its records in the git-ignored `.agents/aced/results/`.

## Asks before acting

- `improve`: each fix, individually.
- `bench`: ACED shows the plan and its spend ceiling, and runs only after a yes.
- A committed secret: asks you to rotate it before it untracks the file.

## Hands off to

[`buddy-agent-harness`](https://github.com/repobuddy/buddy-agent-harness) for instructions and harness config,
[`llms-txt`](/repobuddy/skills/llms-txt/), [`review-permissions`](/repobuddy/skills/review-permissions/),
[`setup-github-repo`](/repobuddy/skills/setup-github-repo/), [`min-release-age`](/repobuddy/skills/min-release-age/),
and [`setup-npm-trusted-publishing`](/repobuddy/skills/setup-npm-trusted-publishing/).

## Requirements

- Node.js to run the script. Falls back to `npx -y repobuddy@^1.12.0 agent-readiness` (needs network). See
  [Skill scripts](/repobuddy/cli/skill-scripts/).
- `bench` needs ACED (the plugin, or `npx` with network) and the `claude` CLI.

## Example

```
/agent-readiness score --check --min-level 3
```

More detail: [skill README](https://github.com/repobuddy/repobuddy/tree/main/packages/buddy/skills/agent-readiness).
