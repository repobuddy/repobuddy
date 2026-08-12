---
status: draft
project-path: .
name: repobuddy-repo
---

# repobuddy-repo — project spec

The repo-root project: the **skill repo** half of `repobuddy/repobuddy`. It ships **public agent
skills** to consumers (`npx skills add repobuddy/repobuddy`) and carries the repo harness that
builds, checks, and releases everything in the monorepo.

## Scope — what this spec governs

This spec governs the **repo-root project only**: `skills/`, and the repo-level tooling around it.
It is named `repobuddy-repo` rather than `repobuddy`, because **`repobuddy` is already taken** — it
is the npm package at `packages/buddy`, which has its own spec (below). Two specs answering to one
name would break name-to-spec resolution.

It does **not** govern the published npm packages under `packages/` or the Astro site under
`website/`. Each is a **separate project** with its own spec — one spec per project is the rule.
Their absence here is correct, not a coverage hole.

| Project | Spec | Status |
|---|---|---|
| `repobuddy` (the CLI, `packages/buddy`) | [`packages/buddy/.agents/spec/`](../../packages/buddy/.agents/spec/spec.md) | exists |
| `@repobuddy/jest`, `/vitest`, `/biome`, `/typescript`, `/test` | — | not yet backfilled |
| `website/` | — | not yet backfilled |

Note that sibling projects here **colocate** their spec at `<project>/.agents/spec/` rather than
hoisting to `.agents/specs/<name>/`. Colocation is the default, and an npm package can keep its spec
out of the published tarball through `files` / `.npmignore`, so there is no reason to hoist.

## Organization — capability-first

The layout strategy is **capability-first**: top-level folders are named for what the project *does*.
Three folders are deliberately not capabilities — `design/` (the rules and the model), `workflows/`
(how capabilities compose into whole flows), and `design/decisions/` (the append-only ADR log).
Single documents live as root files beside this one, never as folders — hence `glossary.md`.

A node is `<capability>/<unit>` and never sits three deep. A sub-grouping inside a capability is a
cross-cutting **`concept:`** tag, recovered through the by-concept index below, never a third folder
level.

### Placement map

| A concept of this kind | lives here |
|---|---|
| A shipped public agent skill (one unit per skill) | `agent-skills/<skill>/` |
| A rule or model that spans skills (the *why*) | `design/` |
| A decision with a chosen-vs-rejected fork | `design/decisions/` (ADR, append-only) |
| A flow composing several capabilities end to end | `workflows/` |
| Build, CI, packaging, dependency policy | `tooling/` |
| A load-bearing term | `glossary.md` |

**Tie-breaks.** A skill's *platform syntax reference* (`assets/*.md`) is part of the skill's unit,
not a `design/` doc — it is shipped material the skill loads at runtime, not a rule about the repo.
A rule about *how skills are authored* is `design/`, because it binds every skill and belongs to no
one of them.

The cross-cutting **by-concept index** is generated at the foot of this file from `concept:`
frontmatter — refresh it with the `concept-index` skill rather than editing it.

## Capabilities

| Capability | What it does |
|---|---|
| [agent-skills](./agent-skills/README.md) | Ship installable agent skills to consumers |
| [tooling](./tooling/README.md) | Build, check, and release the monorepo |

<!-- BEGIN generated: by-concept (project-spec/concept-index) -->

## By concept

> Generated from `concept:` frontmatter by `project-spec/concept-index` — do not edit by hand.

| Concept | Facets |
|---|---|
| `content-composition` | `agent-skills/to-question/` (behavior) |
| `human-handoff` | `agent-skills/to-question/` (behavior) |
| `platform-rendering` | `agent-skills/to-question/` (behavior) |

<!-- END generated: by-concept -->
