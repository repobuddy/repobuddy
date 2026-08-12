---
name: repobuddy
project-path: packages/buddy
status: draft
---

# repobuddy — project spec

`repobuddy` is the plugin-based command-line tool that manages a repository. It ships as the
npm package `repobuddy` and is invoked as `buddy` (or the short alias `bd`). It is built on
[`clibuilder`](https://www.npmjs.com/package/clibuilder) v9, which supplies the command shell,
the configuration file resolution, and the plugin auto-loading — so much of what repobuddy
promises is *inherited* behavior that this spec still has to pin down, because a consumer
cannot tell inherited behavior from authored behavior and depends on both.

The work this project does is: **set a repository up** (`init`), **manage which plugins are
active** (`add` / `remove` / `update` / list and search), and **resolve the configuration**
that records those choices. Each plugin then contributes its own commands — `@repobuddy/typescript`
adds a `ts` command, for example — so the CLI's surface grows with what the repository installs.

## Capabilities

| Node | Kind | What it covers |
|---|---|---|
| [`cli-shell/`](./cli-shell/README.md) | behavioral | The runtime shell: the `buddy` / `bd` entry points, version, description, help, and what happens when no command or an unknown command is given. |
| [`configuration/`](./configuration/README.md) | behavioral | Resolving `.repobuddy.json` and its accepted variants, and validating what it contains. |
| [`initialization/`](./initialization/README.md) | behavioral | `buddy init` — writing the configuration, detecting already-installed plugins, and scaffolding template files, safe to repeat. |
| [`plugin-management/`](./plugin-management/README.md) | descriptive | The capability index for adding, removing, updating, and discovering plugins, and the contract a plugin implements. |
| [`tooling/`](./tooling/README.md) | descriptive | How the package is built and published — the build outputs, the published file allowlist, and the `bin` mapping. |
| [`workflows/`](./workflows/README.md) | behavioral | End-to-end flows across capabilities: the paths a real user actually walks. |
| [`design/`](./design/README.md) | descriptive | The rules and the model — why the capabilities are shaped the way they are. Holds the decision log. |

[`glossary.md`](./glossary.md) defines every load-bearing term.

## Placement map

**Strategy: `capability-first`.** Top-level folders are named for what repobuddy *does*, so the
tree says what the tool is for rather than how its source is arranged. This was chosen over
`mirror-source` because the source is a three-file shell (`app.ts`, `bin.ts`, `bin/buddy.js`)
that mirrors nothing useful — the capabilities are almost entirely unbuilt, so there is no
existing structure worth tracking. `check-partition-quality` was run and declined to decide
(8 usable multi-file commits against a floor of 20 — the history is too thin to measure), so
the choice rests on the default rather than on this project's numbers.

Because most capability folders are spec-side abstractions over source that does not exist yet,
spec↔source divergence is expected and accepted: the spec drives the build here, not the reverse.

### Routing table

| A concept of this kind | Lives here |
|---|---|
| A command the user types (`init`, `add`, …) | The capability folder for what the command accomplishes — not a folder named for the verb alone. |
| Behavior of the CLI itself, independent of any command | `cli-shell/` |
| Reading, locating, or validating the config file | `configuration/` |
| Anything about which plugins are active, or how one is obtained | `plugin-management/<unit>/` |
| The interface a plugin author implements | `plugin-management/plugin-contract/` (reference artifact — homed with the capability that consumes it) |
| A rule, model, or rationale that no scenario tests directly | `design/` |
| A decision, with its alternatives and why one won | `design/decisions/` |
| Build, packaging, publishing, dependencies | `tooling/` |
| A flow crossing two or more capabilities | `workflows/` |
| A single document that is not a node | A root file beside this one (as `glossary.md` is) |

**Tie-breaks** — contested overlaps already adjudicated:

| Overlap | Ruling |
|---|---|
| `bin` entry points: packaging fact or runtime behavior? | The `package.json` `bin` **mapping** is `tooling/`; whether invoking `buddy` and `bd` actually reaches a working CLI is `cli-shell/`. |
| `init` writes config — does it belong to `configuration/`? | No. `configuration/` owns *reading and validating*; `initialization/` owns *writing the initial file*. |
| `init` detects installed plugins — is that `plugin-management/`? | No. Detection at bootstrap is part of `init`'s job; `plugin-management/` owns changes made after bootstrap. |

### Nesting rule

A node is `<capability>/<unit>` and never sits three deep. A sub-grouping inside a capability is
recorded as a `concept:` tag in that node's frontmatter and recovered through the by-concept index
below — never as a third folder level.

## By-concept index

<!-- concept-index:start -->
<!-- Generated by the `concept-index` skill from each node's `concept:` frontmatter. Do not hand-maintain. -->
<!-- concept-index:end -->
