# Old bench results, and converting them

`bench` has moved to ACED's measured layer, whose run and comparison records are schema version 3
and documented with ACED's `bench` skill. This file describes what the old `bench` wrote, for a repo
that still has it, and how `bench convert` turns it into a version-3 record.

The old `bench --yes` wrote one results file per bench to
`.agents/readiness/bench/results/<createdAt>.json`, with `:` and `.` in the timestamp replaced by `-`,
and each run's gzipped transcript beside it. `bench --yes --baseline` also wrote `baseline.json` beside
`tasks.json`: the same record without `results`, committed.

## Converting

```bash
node <this-skill-dir>/scripts/agent-readiness.mjs bench convert <results.json> --arm <label> [--task-set <dir>] [--out <file>]
```

It reads a version 1 or 2 results file and writes a version-3 run record, to `--out` or stdout. ACED
reads version 3 only, so convert both sides of a pair, then re-read them with
`aced-bench compare --suite repobuddy.readiness --before <before> --after <after>`.

| Version-3 field | Filled from |
| --- | --- |
| `suite` | `--suite`, default `repobuddy.readiness` |
| `arm` | `--arm`, such as `before` or `after` |
| `subject` | `{ kind: "git-ref", ref, commit }`, both the old `commit` |
| `adapter` | `repobuddy.bench`: the runs came from the old runner, not an ACED adapter |
| `runner`, `harness`, `model`, `createdAt` | the old record's (`runner` defaults to `print`) |
| `scoring_model` | the old `model` |
| `taskSetCommit` | the old `taskSetCommit`, or `commit` on version 1 |
| `taskSetHash`, `evaluated` | hashed from `tasks.json` and `checks/` in `--task-set` (default the suite folder), as ACED hashes a suite |
| `runs` | the old `results`, with `error` and `transcript` set to `null` when absent |
| `summary` | recomputed from `runs` the way ACED summarizes |

Point `--task-set` at the task set the runs used. ACED compares only records with the same task-set
hash and adapter, so converted records compare with each other, never with a run ACED made. A baseline
converts only while its results file is still in `results/` beside it; otherwise record a new baseline
with ACED.

## Versions

`schemaVersion` says which shape a file has. A file without it is version 1.

| Version | Change |
|---|---|
| 1 | The first shape. No `schemaVersion` and no `taskSetCommit`; `commit` is HEAD. `runner` may be absent: read it as `print`. |
| 2 | Adds `schemaVersion`, `taskSetCommit`, and `results[].transcript`. With `--ref`, `commit` is the ref's commit, not HEAD. |

`bench convert` reads both.

## Record

| Field | Type | Meaning |
|---|---|---|
| `schemaVersion` | `2` | The shape of this file. |
| `createdAt` | ISO 8601 string | When the bench finished. |
| `commit` | string | The commit every run checked out: HEAD, or what `--ref` resolved to. |
| `taskSetCommit` | string | The commit the task set came from: always HEAD. Equals `commit` unless `--ref` named another commit. |
| `model` | string | The model every run used. |
| `harness` | `"claude-code"` | The agent harness. |
| `runner` | `"print"` or `"interactive"` | How the agent was driven. Runs from different runners are not comparable. |
| `runsPerTask` | number | Runs per task. |
| `summary` | object | Totals and per-task medians; see below. |
| `results` | array | One entry per run; results files only, not `baseline.json`. |

`commit` and `taskSetCommit` are absent only when the repository has no commits.

## `results[]`

| Field | Type | Meaning |
|---|---|---|
| `task`, `run` | string, number | The task id and the run's number, from 1. |
| `pass` | boolean | The task's `check` exited 0. |
| `wallMs` | number | Wall time of the agent alone, not setup or check. |
| `inputTokens`, `outputTokens`, `cacheReadTokens`, `cacheCreationTokens` | number | Token counts from the harness. |
| `turns`, `toolCalls` | number | Model responses and tool calls. |
| `costUsd` | number | The harness's own cost for the run. |
| `capped` | boolean | The run stopped on its budget, timeout, or an error before finishing. |
| `error` | string, optional | Why the run failed to run, such as a failed setup. |
| `transcript` | string, optional | The run's gzipped transcript, relative to the repository root. Absent when the agent never ran or produced no output. |

## Transcripts

A transcript is the runner's own record, gzipped JSONL:

- `print` runner: the `claude -p --output-format stream-json` output, ending in a `result` event.
- `interactive` runner: the session's transcript, then each subagent's, one JSON object per line.

They are compressed because one run's transcript can run to megabytes uncompressed. Delete old
result folders when they are no longer needed; nothing reads them but you.

## `summary`

`runs`, `passes`, `passRate`, `totalCostUsd`, `costPerSuccessUsd` (absent when nothing passed), and
`tasks[]`: per task, `task`, `runs`, `passes`, `passRate`, `capped`, `errors`, the medians
`medianInputTokens`, `medianOutputTokens`, `medianCacheReadTokens`, `medianTurns`, `medianToolCalls`,
`medianWallMs`, then `totalCostUsd` and `costPerSuccessUsd`.
