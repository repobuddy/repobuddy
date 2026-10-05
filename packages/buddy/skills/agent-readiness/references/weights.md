# Area weights and their evidence

The weights only order the fixes and the per-area scores. They never touch gates or the level. They
started as estimates, and `bench` results are meant to revise them. This file records, for every
weight, the bench runs it rests on, or that it has none yet. The repository defaults themselves are
the `## Weights` section of [repobuddy.readiness.md](repobuddy.readiness.md), which the script reads.
Change a default only with a run behind it, and add that run here.

## Repository weights

| Area | Weight | Based on |
| --- | --- | --- |
| `verification` | 25 | Unmeasured starting estimate. |
| `instructions` | 15 | Unmeasured starting estimate. |
| `navigability` | 15 | Unmeasured starting estimate. |
| `noise` | 15 | Starting estimate, kept after [pilot 1](#pilot-1-comment-density-on-buddy-agent-harness). The pilot benched its comment checks (`comment-signal`, `orphaned-jsdoc`) and found no change in pass rate and at most a small change in cost. That gives no reason to raise it. Its other three checks are unmeasured. |
| `self-describing` | 10 | Unmeasured starting estimate. |
| `environment` | 10 | Unmeasured starting estimate. |
| `task-discovery` | 5 | Unmeasured starting estimate. |

## Package weights

`bench` measures a repository, not what a consumer's agent spends, so no run can inform these yet.

| Area | Weight | Based on |
| --- | --- | --- |
| `api` | 30 | Unmeasured starting estimate. |
| `docs` | 25 | Unmeasured starting estimate. |
| `errors` | 15 | Unmeasured starting estimate. |
| `changelog` | 15 | Unmeasured starting estimate. |
| `llms-txt` | 15 | Unmeasured starting estimate. |

## Runs

### Pilot 1: comment density on buddy-agent-harness

- **Lever:** cutting source comments down to what a name cannot say
  ([buddy-agent-harness#140](https://github.com/repobuddy/buddy-agent-harness/pull/140)). Comment
  share went 29% → 17%, and the `noise` area 67% → 100%. The level stayed at 2.
- **Protocol:** before `6fbed36`, after `ebb1a8f`, one task set (two seeded bugs, a small feature, a
  question). `bench --runs 5`, Sonnet, the `claude -p` runner, $0.50 cap per run. 40 runs per bench.
- **Results**, from two benches of the same pair
  ([repobuddy#690](https://github.com/repobuddy/repobuddy/issues/690),
  [repobuddy#733](https://github.com/repobuddy/repobuddy/pull/733)):

  | | Pass rate | Cost per success | Pooled cost |
  | --- | --- | --- | --- |
  | First bench | 20/20 → 20/20 | $0.069 → $0.071 | +1% (p 0.68) |
  | Second bench | 20/20 → 20/20 | $0.072 → $0.068 | −6% (p 0.008) |

  Both benches found the question task about 9% cheaper (p ≈ 0.01). The first found the feature task
  28% more tokens (p 0.03), which the second did not reproduce (−5% cost, p 0.48).
- **Reading:** pass rate cannot move on tasks this easy. The cost effect is 0–6% per success, and the
  two benches differ by as much as the effect. That is a null result for the weight: not enough to
  raise or lower it.
- **Data:** `.agents/aced/bench/repobuddy.readiness/pilots/buddy-agent-harness/` in the repobuddy
  repository; its two records are converted to ACED's schema version 3, so `aced-bench compare`
  re-reads them.

## What would revise a weight

- An effect on pass rate, or a pooled cost change that a second bench reproduces.
- Tasks hard enough that some runs fail, and 10 or more runs a side.
- More than one repository for the same lever. One repo's result belongs in its own
  override, `.agents/references/repobuddy.readiness.md`, not in the defaults.

`agent-readiness suggest` applies the per-repo half of this bar to ACED comparisons tagged with an
area: it suggests a step of 5 only on an effect two comparisons replicate, and "keep the weight"
otherwise. Record its evidence in the pull request that adds the override.
