---
cr-ref: github-804
target: packages/buddy/skills/project-tracker
status: active
todos:
  - content: Spec node for project-tracker, issue routing revision, contract Routing section; spec gate
    status: completed
  - content: Ship the project-tracker skill, the issue revision, and the contract Routing section; impl gate
    status: completed
  - content: Website page, skill lists, changeset; audit validate and pnpm verify
    status: completed
  - content: Live proof on a scratch fixture (mixed routing; missing, ambiguous, unknown-contract checks)
    status: completed
  - content: Dogfood notes in issue-epic-initiative.plan.md
    status: completed
  - content: PR against main; shepherd CI until green
    status: pending
---

# github-804: project-tracker routing

CR: [repobuddy/repobuddy#804](https://github.com/repobuddy/repobuddy/issues/804), child of epic #801.
Design: [ADR 0003](../spec/design/decisions/0003-split-file-issue-by-level.md) decisions 4, 5, 8, 9.

## NEXT

The spec and impl gates passed and the work is committed. Open the pull request against `main` and
shepherd CI until it is green; never merge it.
