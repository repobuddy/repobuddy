# 0001 — Delegate package manager detection and command construction

**Date:** 2026-08-12
**Status:** accepted

## Context

`add`, `remove`, and `update` all have to change the repository's dependencies, which means working
out which package manager the repository uses and invoking it correctly. The spec originally proposed
doing this ourselves, with a stated precedence (a declared `packageManager` field, then the lockfile,
then npm) and a per-tool command table.

Two problems surfaced while specifying it:

1. **The precedence was a proposal, not a decision.** It had no authority behind it beyond seeming
   reasonable, and it was the last item blocking the spec gate.
2. **The command vocabulary diverges**, though less than feared. npm accepts `add` and `remove` as
   aliases, so only `update` differs — and yarn splits it further across its own majors (`upgrade` on
   v1, `up` on berry). Getting that right and *keeping* it right is ongoing work that has nothing to
   do with repobuddy's purpose.

## Decision

Use **[`package-manager-detector`](https://www.npmjs.com/package/package-manager-detector)** — the
library `@antfu/ni` is built on — for both detection and command construction. Do not implement
either.

It exposes exactly the two things needed, and no CLI:

- `detect({ cwd })` → `{ name, agent, version }`
- `resolveCommand(agent, command, args)` → the command and arguments to run

## Why this one

`@antfu/ni` itself was the starting suggestion, but it is a **CLI** — its exports are the `ni` / `nr`
/ `nun` binaries. Shelling out to another CLI would mean requiring users to install it, or vendoring
a binary. `package-manager-detector` is the same logic as a pure library with no `bin` at all, which
is what we actually want.

Verified before adopting (2026-08-12):

| Check | Result |
|---|---|
| Precedence: declared field vs. lockfile | `packageManager: yarn@1.22.22` + `pnpm-lock.yaml` → **yarn**. The field wins. |
| Precedence: lockfile only | `yarn.lock` → yarn |
| Precedence: neither | → npm |
| Detects this repository | `{ name: 'pnpm', agent: 'pnpm', version: '11.21.0' }` — matches our `packageManager` field |
| yarn major split | `resolveCommand('yarn', 'upgrade')` → `yarn upgrade`; `resolveCommand('yarn@berry', 'upgrade')` → `yarn up` |

The precedence it implements is **identical** to the one the spec had proposed. So this is not a
compromise to get a library — it is the same decision, already made and maintained by someone else.

It also supports **bun**, which our own design had not considered at all.

## Consequences

- **The open precedence decision is resolved** by delegation. It was the last thing blocking the spec
  gate.
- **`plugin-management/package-manager/` shrinks from 8 scenarios to 3.** Detection precedence and
  command construction are now a dependency's behavior, and by the rule in
  [`../inherited-behavior.md`](../inherited-behavior.md) we specify our promise, not their mechanism.
  What stays is what is genuinely ours: operations run through the repository's own tool, and a
  failed operation changes nothing else.
- **A new assumption enters the register (8)**, guarded by a learning test rather than by scenarios.
- **A second runtime dependency.** repobuddy currently depends only on `clibuilder`. This is a
  deliberate, narrow addition: no `bin`, a single focused job, and it replaces code we would
  otherwise write and maintain badly.
- We inherit bun support without asking for it.

## Alternatives rejected

- **Implement detection ourselves.** Rejected: it is ongoing maintenance for a problem already
  solved, and our precedence would have been a guess with no authority behind it.
- **Shell out to `@antfu/ni`.** Rejected: it is a CLI, so it would become an install-time requirement
  for users or a vendored binary.
