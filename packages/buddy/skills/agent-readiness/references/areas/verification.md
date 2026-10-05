# Verification loop (weight 25)

Agents do their best work iterating against real feedback. This is the biggest lever on result
quality, so it carries the largest weight.

## Checks

| Id | Level | Gate | Decided by |
| --- | --- | --- | --- |
| `verify-command` | 2 | yes | script: a `verify`, `check`, `validate`, `ci`, or `pre-commit` script or Make target |
| `test-command` | 2 | yes | script: a `test` script or Make target |
| `ci-config` | 2 | no | script: a CI config the repo's host runs |
| `ci-runs-verify` | 2 | yes | **judgment** |
| `fast-feedback` | 3 | no | script: a pre-commit hook config (husky, lefthook, pre-commit, simple-git-hooks, lint-staged) |
| `bench-baseline` | 5 | yes | script: `.agents/aced/bench/repobuddy.readiness/baseline.json` recorded at most 90 days ago (see `bench` in SKILL.md) |

## Judging `ci-runs-verify`

Open the CI files the script lists. Pass when the job that gates merges calls the same verify command
an agent runs locally, or a documented superset of it, and nothing in it waits for input.

Fail when:

- CI runs steps the local command skips (a lint only CI runs, a typecheck only CI runs), so a local pass does not predict a CI pass
- the local command needs a service, secret, or login CI provides but the instructions do not mention
- a step prompts, or needs a TTY

A verify command whose name does not say what it covers is still a pass when the instructions file
explains it.

## What the script cannot see

Report these when you notice them, without scoring them:

- flaky tests (a test that fails and then passes on rerun, or is marked skip with a "flaky" note)
- a verify command that takes minutes when a fast subset would give feedback in seconds
- failures that do not name the file or the fix
