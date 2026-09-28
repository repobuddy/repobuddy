---
name: review-api
description: Use this skill when reviewing a library's public API for consistency and completeness against its own conventions.
---

# Review API

Review a library's public surface against the conventions the library already follows, and report where it drifts and where it has gaps.

Use when asked to "review the project for consistency", "check API completeness", "what is missing from the API", "find naming drift", "are the docs in sync with the exports", or before a major release when the surface is about to be frozen.

The yardstick is the project itself. The skill never grades the API against an outside style guide, and never proposes an API the project gives no reason to expect.

This skill **reads and reports**. It edits nothing. When the report is done, it offers to file issues or start the cleanup.

## When not to use

- Reviewing a diff or PR for design quality — use `code-review`.
- Hunting defects — tests, type checkers, and linters do that first.
- An application with no public surface — there is no consumer, so there is no API to complete.

## Workflow

### 1. Find the surface

Identify what the project publishes before reading anything else.

| Project type | Surface |
| --- | --- |
| TypeScript/JavaScript package | the entry module(s) and `exports` in `package.json`, including subpath entries |
| Monorepo | each published package's entry; skip private workspace packages |
| CLI | the command table the parser is built from |
| HTTP service | the route table or OpenAPI document |

List every exported name with its declaring file. This list is the input to every later step, so build it from the entry points, not from a directory listing — a file that is never exported is not surface.

### 2. Infer the canonical shape

Pick two or three **exemplars** for each kind of unit the surface contains — the reference predicate, the reference namespace, the reference command. Prefer units the docs point at, units with the fullest tests, and units most other files resemble.

From the exemplars, write down the canonical shape as a short checklist:

- signature form and parameter order
- file and export naming
- namespace or grouping members
- doc comment vocabulary and required tags (`@example`, `@since`, `@deprecated`)
- test location and naming
- any documented fast path or pattern the exemplar says others should follow

State the exemplars and the checklist in the report. A finding is only as good as the shape it is measured against, and the reader must be able to dispute the shape.

When two exemplars disagree, do not pick a winner. Record it as a design-level drift finding in step 5 and measure against what the two share.

### 3. Fan out the audits

Run three audits in parallel. Each is read-only and receives the surface list and the canonical shape. Delegate them to cheap subagents where the harness supports it; otherwise run them one after another.

| Audit | Question | Typical findings |
| --- | --- | --- |
| **Shape conformance** | Which units deviate from the canonical shape? | a different signature form, a missing namespace member, doc vocabulary copied from a sibling, a misnamed file |
| **Sibling completeness** | Where does an existing family imply a missing member? | `Add`/`Subtract`/`Multiply` without `Divide`; `IsX` without `IsNotX`; `HasNull`/`HasUndefined` without `HasNever`; an internal helper every sibling needs but that is not exported |
| **Docs vs exports** | Do the docs and the surface agree? | undocumented exports, docs for removed exports, stale references, a generated manifest (such as `llms.txt`) with no sync check, one fact documented in two places |

Each audit returns findings anchored to `file:line`, with the evidence that produced them. A finding with no anchor is dropped.

### 4. Verify every claim

Subagents get things wrong. Before a finding reaches the report, open the anchor and confirm it yourself.

Common false positives:

- untracked build output (`dist/`, `lib/`, generated `.d.ts`) reported as stale committed docs — check `git ls-files`
- a "missing" member that exists under a re-export or in another entry point
- a "deviation" that the project documents as intentional — a deprecated alias kept on purpose, a variant with a stated reason
- a doc bug quoted from a stale copy instead of the current file

Drop a finding you cannot confirm. Mark a confirmed intentional exception as such and exclude it from the counts.

### 5. Report by priority

Order the report so the cheapest, most certain fixes come first.

```markdown
## API review — <project>

Surface: N exports across M entry points
Exemplars: `<unit>` (`path`), `<unit>` (`path`)
Canonical shape: <the checklist, one line per rule>

### 1. Obvious fixes
Typos, copy-paste doc bugs, dead or commented-out exports, misnamed files.

### 2. Design-level drift
The same concept under two names or two constraints; a documented pattern adopted by a
fraction of the units it applies to; exemplars that disagree.

### 3. Sibling-justified gaps
| Missing | Family that implies it | Evidence |

### 4. Docs
Undocumented exports, stale references, unsynced generated files, duplicated doc homes.

### Intentional exceptions
Deviations the project documents on purpose — listed so no one "fixes" them.

### Suggested order of work
```

Give counts where they carry the point — "the fast path appears in 5 of 104 predicate files" says more than "rarely adopted".

Close by offering to open one issue per section, or to start on the obvious fixes.

## Rules

- **Only a sibling justifies a gap.** Flag a missing member only when an existing family makes the analogy clear. Never invent an API because it would be nice to have.
- **Intentional is not drift.** A deviation with a documented reason is an exception, not a finding.
- **Measure against the project.** No external style guide, no personal taste.
- **Verify before reporting.** An unverified subagent claim does not reach the report.
- **Read only.** No edits, no issues filed, until the user says so.

## Anti-patterns

- Proposing speculative APIs with no sibling to justify them
- Reporting subagent output without opening the anchors
- Treating build output or untracked files as part of the surface
- Averaging exemplars that disagree into a shape neither follows
- Mixing obvious fixes and design questions in one list, so the easy wins get lost
- Filing issues or editing code before the user asks
