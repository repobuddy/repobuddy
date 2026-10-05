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
buddy agent-readiness bench [--dir <repo>]
buddy agent-readiness bench convert <results.json> --arm <label> [--suite <s>] [--task-set <dir>] [--out <file>]
buddy agent-readiness suggest [--dir <repo>] [--area <id>] [<comparison.json>...] [--json]
```

## Subcommands

| Subcommand | Effect |
| --- | --- |
| `score` | Reports the gated level (1 to 5), a score per area, the top three fixes, and the tokens every agent session loads. Writes nothing. |
| `score --package` | Scores the consuming side of a package: what ships (declarations, exports map, README, changelog, `llms.txt`). The level tops out at 4. |
| `bench` | Prints where the benchmark moved: ACED's measured layer (`npx -y -p cyber-aced@^0.3.0 aced-bench`), suite `repobuddy.readiness`. Runs nothing. |
| `bench convert` | Converts a results file the old `bench` wrote (schema version 1 or 2) into an ACED version-3 run record that `aced-bench compare` reads. |
| `suggest` | Reads ACED comparison records of suite `repobuddy.readiness` tagged with an `area` (by default every `compare-*.json` under `.agents/aced/results/bench/repobuddy.readiness/`) and prints a suggested `## Weights` line for `.agents/references/repobuddy.readiness.md`, with its evidence. Writes nothing. |

## Arguments

| Flag | Used by | Type | Default | Effect |
| --- | --- | --- | --- | --- |
| `--dir` | `score`, `bench`, `suggest` | path | the current directory | The repository. Cannot be combined with `--package`. |
| `--package` | `score` | path | none | Scores a package instead of a repository. |
| `--json` | all | boolean | off | Prints JSON. |
| `--run-knip` | `score` | boolean | off | Runs the repository's knip command to settle the `dead-code` check. Dependencies must be installed. Not with `--package`. |
| `--check` | `score` | boolean | off | CI mode: exits `1` when the level is below `--min-level`. |
| `--min-level` | `score` | whole number | `3` | The level `--check` requires. 1 to 5 for a repository, 1 to 4 for a package. Needs `--check`. |
| `--arm` | `bench convert` | label | none, required | The record's arm, such as `before` or `after`. |
| `--suite` | `bench convert` | suite name | `repobuddy.readiness` | The record's suite. |
| `--task-set` | `bench convert` | path | `.agents/aced/bench/<suite>` | The task set the runs used; its `tasks.json` and `checks/` are hashed into the record. |
| `--out` | `bench convert` | path | stdout | Where to write the record. |
| `--area` | `suggest` | weighted area id | every tagged area | Suggests for one area; an area with no comparison prints "keep the weight". |

An unknown flag is a usage error.

## Behavior

- `score` builds nothing and installs nothing. When `buddy-agent-harness` is installed, it also runs that package's
  read-only `doctor`.
- A check with status `JUDGE` is one the script cannot decide. The agent running the skill settles it. `--check`
  counts only the gates the script decides.
- Token counts are estimated at four characters per token.
- `instructions-scope` (instructions area, level 3, not a gate) is `fail` when no instructions file states a purpose
  or boundary, or when a well-known scope file such as `GOALS.md` exists but no instructions file names it. When a
  statement is found, it is `JUDGE`. It is `n/a` when the repository has no instructions file. In a monorepo it also
  scores each workspace package that is not `private`, on a scope file inside the package that its own `AGENTS.md` or
  the root instructions file names, or a scope line in its own `AGENTS.md`; a root `GOALS.md` is not expected. It is
  `fail` when the root or any of those packages fails, and the detail lists each, plus the private packages skipped.
- The area weights come from the reference `repobuddy.readiness`: the skill's default, under any
  `.agents/references/repobuddy.readiness.md` (project) or `~/.agents/references/repobuddy.readiness.md` (user)
  override with `merge: merge-sections` and a `## Weights` section of `- <area>: <number>` items. A malformed item
  exits `2`.
- `.agents/readiness/weights.json` is deprecated. It is still read when no project override exists, and stderr
  prints the override file to create instead.
- Level 5 reads `.agents/aced/bench/repobuddy.readiness/baseline.json`, the baseline ACED's `bench` records.

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

`bench` (first line, on stderr):

```
agent-readiness bench has moved to ACED's measured layer. Run it with suite repobuddy.readiness:
```

## Exit codes

| Code | When |
| --- | --- |
| `0` | Success. |
| `1` | `bench`, which only prints where it moved; `bench convert` or `suggest` cannot read a file; or `score --check` finds the level below `--min-level`. |
| `2` | A usage error, or malformed weights in the reference override or the deprecated `.agents/readiness/weights.json`. |

## Related

- [`agent-readiness` skill](/repobuddy/skills/agent-readiness/)
