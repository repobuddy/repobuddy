---
cr-ref: issue-epic-initiative
target: packages/buddy/skills/file-issue
status: in-progress
todos:
  - content: Record the decisions — ADR 0002 (noun-first routing names), ADR 0003 (split by level), glossary terms
    status: completed
  - content: Align the reference names with agent-harness naming (repobuddy. prefix, dots not slashes)
    status: completed
  - content: 'Spike: GitHub, GitLab, Bitbucket mapping of each adapter op and each level'
    status: in_progress
  - content: 'Spike: adapter contract, stress-tested on Asana and Linear; work-tracker format'
    status: in_progress
  - content: 'Spike: promotion and demotion rules, level checks, body templates'
    status: in_progress
  - content: 'Spike: name clashes for issue, epic, initiative in the skills registry'
    status: completed
  - content: Fold the spike results into ADR 0003 and the glossary
    status: pending
  - content: File this plan as an epic with its child issues (dogfood the epic workflow by hand)
    status: pending
---

# Epic: file tracked work at any level, on any tracker

This plan is tracked as an epic, by hand, the way the `epic` skill will do it. Each section below
is a step that skill must perform. Where this session did something the skill should do, the
**Dogfood** notes record it, so the skill is specified from a real run.

## Outcome

`file-issue` is replaced by three routing skills, `issue`, `epic`, and `initiative`, that file any
category of tracked work at the right level, on any tracker an adapter supports, with teams able to
override the levels, templates, and routing. See
[ADR 0003](../spec/design/decisions/0003-split-file-issue-by-level.md).

**Done when** every child issue below is done. The `initiative` child may move to another package
(ADR 0003, Scope); then this epic is done without it.

## Non-goals

- Filing documents or submissions that have no lifecycle (ADR 0003, Scope).
- A tracker adapter other than GitHub, GitLab, and `cyber-asana` in this epic.

## Child issues

Ordered as ADR 0003's build order. Each ships on its own.

1. **`issue`**: rename `file-issue` to `issue`, add the task category and the built-in GitHub and
   GitLab adapters. Breaking rename, with a changeset. Update every page that names `file-issue`
   (spec docs, `to-question`, `agent-readiness`, website, root readme), except ADR 0001.
2. **References**: move the templates and level checks into `repobuddy.work-levels` and
   `repobuddy.work-template.<kind>`; add `repobuddy.work-tracker`.
3. **`cyber-asana.tracker-adapter`**: the first external adapter, in the `cyber-asana` repository.
4. **`epic`**: create an epic and its issues; promote issue → epic; demote initiative → epic.
5. **`initiative`**: built last, against a real initiative (ADR 0003, Scope).

Each child gets an SDD spec node under `.agents/spec/agent-skills/` and evals before it ships.

## Open questions (spiked)

Results go here and into ADR 0003 when the spikes return.

- **Name clashes: low risk.** `npx skills find` shows no skill named exactly `issue`, `epic`, or
  `initiative`. Nearest are differently named (`mattpocock/skills@to-issues`, `create-epics`,
  `bmad-ticket`). `find` is fuzzy and capped near 20 results, so an exact match outside the top
  results is not ruled out. `create-issue` is common, one more reason to leave that name.

## Dogfood notes

What the `epic` skill must do, observed in this session:

1. **Scope before breakdown.** The session settled the outcome and the level boundaries (ADR 0003)
   before naming any child. The skill asks for the outcome and done-when first.
2. **Audit for gaps before filing.** Asked "do we have the full picture?", the session listed what
   was decided and what was undefined. The skill runs that check before it creates children.
3. **Spike the unknowns, don't guess them.** Undefined items became spikes with a written result,
   not assumptions baked into child issues. The skill marks such a child as a spike.
4. **Check the customization surface against the real resolver.** The reference names were invalid
   under agent-harness (`a/b` is plugin `a`). The skill should validate reference names it writes
   with `reference show`.
5. **Track before filing.** The plan is local until the breakdown is stable; filing comes last,
   after duplicate check and confirmation.
