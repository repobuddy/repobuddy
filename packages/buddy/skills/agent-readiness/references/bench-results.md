# Bench results format

`bench --yes` writes one results file per bench to
`.agents/readiness/bench/results/<createdAt>.json`, with `:` and `.` in the timestamp replaced by `-`.
`results/` is git-ignored. `bench --yes --baseline` also writes `baseline.json` beside `tasks.json`:
the same record without `results`, committed.

## Versions

`schemaVersion` says which shape a file has. A file without it is version 1.

| Version | Change |
|---|---|
| 1 | The first shape. No `schemaVersion` and no `taskSetCommit`; `commit` is HEAD. `runner` may be absent: read it as `print`. |
| 2 | Adds `schemaVersion` and `taskSetCommit`. With `--ref`, `commit` is the ref's commit, not HEAD. |

A reader should accept every version it knows and refuse a higher one, rather than guess at it.

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

## `summary`

`runs`, `passes`, `passRate`, `totalCostUsd`, `costPerSuccessUsd` (absent when nothing passed), and
`tasks[]`: per task, `task`, `runs`, `passes`, `passRate`, `capped`, `errors`, the medians
`medianInputTokens`, `medianOutputTokens`, `medianCacheReadTokens`, `medianTurns`, `medianToolCalls`,
`medianWallMs`, then `totalCostUsd` and `costPerSuccessUsd`.
