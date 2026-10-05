---
title: buddy agent-readiness
description: Score a repository or package for coding agents, and benchmark what agents cost in it.
---

`buddy agent-readiness` scores how ready a repository is for coding agents, and measures what agents cost working
in it. The `agent-readiness` skill runs it.

## Usage

```sh
buddy agent-readiness score [--dir <repo>] [--json] [--run-knip] [--check [--min-level <1-5>]]
buddy agent-readiness score --package <path> [--json] [--check [--min-level <1-4>]]
buddy agent-readiness bench [--dir <repo>] [--init | --baseline] [--runs <n>] [--task <id>] [--ref <commit>] [--runner print|interactive] [--yes] [--json]
buddy agent-readiness bench compare <before.json> <after.json> [--json]
```

## Subcommands

| Subcommand | Effect |
| --- | --- |
| `score` | Reports the gated level (1 to 5), a score per area, the top three fixes, and the tokens every agent session loads. Writes nothing. |
| `score --package` | Scores the consuming side of a package: what ships (declarations, exports map, README, changelog, `llms.txt`). The level tops out at 4. |
| `bench` | Runs the task set in `.agents/readiness/bench/tasks.json` with Claude Code and records tokens, turns, tool calls, wall time, pass rate, and cost per successful task. |
| `bench compare` | Compares two stored results files. Runs nothing and costs nothing. |

## Arguments

| Flag | Used by | Type | Default | Effect |
| --- | --- | --- | --- | --- |
| `--dir` | `score`, `bench` | path | the current directory | The repository. Cannot be combined with `--package`. |
| `--package` | `score` | path | none | Scores a package instead of a repository. |
| `--json` | all | boolean | off | Prints JSON. |
| `--run-knip` | `score` | boolean | off | Runs the repository's knip command to settle the `dead-code` check. Dependencies must be installed. Not with `--package`. |
| `--check` | `score` | boolean | off | CI mode: exits `1` when the level is below `--min-level`. |
| `--min-level` | `score` | whole number | `3` | The level `--check` requires. 1 to 5 for a repository, 1 to 4 for a package. Needs `--check`. |
| `--init` | `bench` | boolean | off | Writes a task-set template and runs nothing. Not with `--baseline` or `--yes`. |
| `--baseline` | `bench` | boolean | off | Stores the run's summary as the baseline. Not with `--task`. |
| `--runs` | `bench` | positive whole number | the task set's `runs`, else `3` | Runs per task. |
| `--task` | `bench` | string | every task | Runs one task. |
| `--ref` | `bench` | commit | `HEAD` | Runs in a clean checkout of that commit, with `HEAD`'s task set. |
| `--runner` | `bench` | `print` \| `interactive` | `print` | `print` runs `claude -p`. `interactive` runs each task in a tmux or herdr pane and needs `CLAUDE_CODE_OAUTH_TOKEN` or `ANTHROPIC_API_KEY`. |
| `--yes` | `bench` | boolean | off | Runs the benchmark and spends money. Without it, `bench` prints only the plan and its spend ceiling. |

A `score` flag passed to `bench`, or a `bench` flag passed to `score`, is a usage error.

## Behavior

- `score` builds nothing and installs nothing. When `buddy-agent-harness` is installed, it also runs that package's
  read-only `doctor`.
- A check with status `JUDGE` is one the script cannot decide. The agent running the skill settles it. `--check`
  counts only the gates the script decides.
- Token counts are estimated at four characters per token.
- `instructions-scope` (instructions area, level 3, not a gate) is `fail` when no instructions file states a purpose
  or boundary, or when a well-known scope file such as `GOALS.md` exists but no instructions file names it. When a
  statement is found, it is `JUDGE`. It is `n/a` when the repository has no instructions file.
- `.agents/readiness/weights.json` can override the area weights. A malformed file exits `2`.
- `bench --baseline` writes `.agents/readiness/bench/baseline.json`. Every other run is compared against it.

## Output

`score` in this repository (first lines):

```
Level 2 of 5: An agent can check its own work
  (gates reach level 3; a security finding caps it at 2)
  provisional: 1 gate(s) marked JUDGE need a decision, and a fail lowers it

Fix first:
  1. [security] `.env` is ignored by git
     Add `.env` and `.env.*` (with `!.env.example`) to `.gitignore`.
  ...

Tokens loaded per session: ~3624 (instructions ~3469, skill descriptions ~155)
```

`score --check` adds a last line such as:

```
check: FAIL, level 1 is below --min-level 3
```

`bench` with no task set:

```
No task set: .agents/readiness/bench/tasks.json does not exist (create one with `bench --init`)
```

## Exit codes

| Code | When |
| --- | --- |
| `0` | Success, including a `bench` run without `--yes` that only prints the plan. |
| `1` | `bench` cannot run, `bench compare` cannot read a file, or `score --check` finds the level below `--min-level`. |
| `2` | A usage error, or a malformed `.agents/readiness/weights.json`. |

## Related

- [`agent-readiness` skill](/repobuddy/skills/agent-readiness/)
