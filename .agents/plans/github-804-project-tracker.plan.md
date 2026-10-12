---
cr-ref: github-804
target: packages/buddy/skills/project-tracker
status: active
todos:
  - content: Spec node for project-tracker, issue routing revision, contract Routing section; spec gate
    status: pending
  - content: Ship the project-tracker skill, the issue revision, and the contract Routing section; impl gate
    status: pending
  - content: Website page, skill lists, changeset; audit validate and pnpm verify
    status: pending
  - content: Live proof on a scratch fixture (mixed routing; missing, ambiguous, unknown-contract checks)
    status: pending
  - content: Dogfood notes in issue-epic-initiative.plan.md; PR against main; shepherd CI
    status: pending
---

# github-804: project-tracker routing

CR: [repobuddy/repobuddy#804](https://github.com/repobuddy/repobuddy/issues/804), child of epic #801.
Design: [ADR 0003](../spec/design/decisions/0003-split-file-issue-by-level.md) decisions 4, 5, 8, 9.

## NEXT

Write the spec node `.agents/spec/agent-skills/project-tracker/`, revise `agent-skills/issue/`, then
run the spec gate with the cold ACED spec-validator.
