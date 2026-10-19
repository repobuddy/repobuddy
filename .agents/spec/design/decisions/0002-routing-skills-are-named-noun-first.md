# 0002 — Routing skills are named noun-first

**Status:** accepted (2026-10-11)
**Context:** naming the skills that replace `file-issue` (see [0003](./0003-split-file-issue-by-level.md))

## Decision

A **routing skill** is named after the noun it manages, bare: `checkpoint`, `issue`, `epic`. A routing
skill is one whose body routes a request to one of several modes, such as create, promote, or
demote, each with its own steps.

A skill that runs a single procedure keeps a verb-noun name: `review-api`, `add-badges`,
`merge-dep-prs`.

## Why

- **The modes outgrow any one verb.** `checkpoint` already covers creating and resuming; it replaced two
  verb-named skills (`pause-session`, `resume-session`). An `epic` skill plans, promotes, and
  demotes. A verb name would describe one mode and mislead about the rest.
- **New modes become rows, not skills.** Adding "close" or "re-parent" to `issue` adds a row to its
  route table. Under verb-noun naming each one would be tempted into a new skill, with its own
  description competing for the same triggers.
- **It matches the routing skills the repo's own toolchain uses**, such as `reference` in
  `@cyberuni/agent-harness` and `asana` in `cyber-asana`.

## Consequences

- A bare noun is more likely to clash with another package's skill of the same name. Inside a
  plugin the namespace separates them (`repobuddy:epic`); an install through `npx skills add` uses
  the bare name, so check the registry before shipping a new noun.
- Renaming an existing verb-noun skill into a routing skill is a breaking change for anyone who
  invokes it by name, and needs a changeset that says so.
