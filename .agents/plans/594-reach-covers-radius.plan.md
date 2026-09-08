---
cr-ref: github-594
target: packages/buddy/skills/merge-dep-prs
status: in-progress
todos:
  - content: Scaffold the SDD node for merge-dep-prs, scoped to the reach-vs-radius gate
    status: pending
  - content: Author spec.md + merge-dep-prs.feature for the gate behavior
    status: pending
  - content: Spec gate — cold judge, then freeze the suite
    status: pending
  - content: Revise SKILL.md — insert the gate step, add What NOT to do
    status: pending
  - content: Write the skill README.md (skill currently ships without one)
    status: pending
  - content: Impl gate — cold judge against the frozen suite
    status: pending
  - content: Open the PR linking issue 594
    status: pending
---

# CR github-594: gate dep-PR merges on verification reach covering blast radius

Source: [repobuddy/repobuddy#594](https://github.com/repobuddy/repobuddy/issues/594).

`merge-dep-prs` uses "CI is green" as its merge oracle. Green is evidence only about what CI
executed. A `changesets/action` v1→v2 bump in an org `.github` reusable workflow passed every check
in its own repo (which has no test suite) and broke the release job in 25 downstream repos.

The invariant: merge when **verification reach ⊇ blast radius**. Reach and radius are independent
quantities, and semver is the wrong axis — the risk belongs to the artifact being changed and who
executes it, not to the version class of the dependency being bumped. The same failure occurs
in-repo when selective test selection (`turbo --filter`, `nx affected`, `paths:` jobs) shrinks reach
below the true dependency graph.

Scope: the gate behavior only. This is **not** a full backfill of `merge-dep-prs` — the rest of the
skill (classification, CI triage, fix recipes, changesets) stays unspecified and remains on the
`agent-skills/README.md` worklist.

## NEXT — resume here

Start at the first pending todo.
