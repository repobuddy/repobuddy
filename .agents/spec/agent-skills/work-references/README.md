---
spec-type: reference
concept:
  - tracked-work
  - tracker-capabilities
---

# work-references

## What

The references the level skills (`issue` today; `epic` and `initiative` later) load by name instead
of carrying the text themselves, so a project can change one section without editing a skill. They
ship in `packages/buddy/references/`, the plugin tier cyber-agentkit resolves
([ADR 0003](../../design/decisions/0003-split-file-issue-by-level.md), decision 5).

## Subject

| Reference | Holds | Headings that are API |
|---|---|---|
| `project-tracker.levels` | the level checks | one `##` per level (Issue, Epic, Initiative), each with `### Is`, `### Done when`, `### Too big`, `### Too small` |
| `project-tracker.template.bug`, `.feature`, `.task` | a body template for a category | the `##` sections of the template |
| `project-tracker.template.epic`, `.initiative` | a body template for a level | the `##` sections of the template |
| `project-tracker.capabilities.interface` | the interface a capabilities reference implements: its sections, the `**Unsupported.**` marker, the item ref, the version, and the format of `project-tracker.routing` (its `Routes` and `Moves` tables) | `Version`, `Sections`, `Unsupported`, `Item ref`, `Overrides`, `Routing` |

**Headings are API.** A team overrides text with `merge: patch` (cyber-agentkit's default), so renaming a heading breaks
every override of it and needs a changeset. The resolver matches and replaces a whole `##` section
and appends one the base lacks (run against the real resolver with a project override over a plugin
copy). In a template, a `##` is one section, so an override restates just that one. In
`project-tracker.levels` a `##` is a whole level: an override of one level restates all four of its
`###` parts (Is, Done when, Too big, Too small), or the level loses the ones it leaves out.

**One canonical copy.** The file in `packages/buddy/references/` is the source, and its frontmatter
says `extends: [default]`. A skill also carries a copy of each reference its `SKILL.md` names in
backticks, as its default `references/<name>.default.md`, because Skills CLI installs copy only a
skill's folder. cyber-agentkit adds that default below the plugin's file, and the `reference` skill
reads it on its own when the command cannot run. The plugin's `extends: [default]` builds on the
default, so a load with both gives no `default-not-selected` warning; the copy leaves that line out,
since a default that extends itself warns `extends-self`. `scripts/sync-skill-references.mjs` writes
the copies, and `--check` (a `verify` task) fails when one is stale, missing, under the old
`<name>.md` name, or no longer named. An interface document is the exception: cyber-agentkit never
composes one, so a default beside the plugin's file would warn `interface-not-composed`. The plugin
alone serves it, and each skill carries a plain `references/<name>.md` copy that it reads itself when
the interface does not load. The script and `verify` own that rule; no scenario repeats it.
The GitHub capabilities reference belongs to the [issue](../issue/README.md) unit, which names it.

**Interface versions.** `project-tracker.capabilities.interface` is the `project-tracker.capabilities` interface, version 1;
it was `project-tracker.contract`, which the interface lists in its `aliases`, so
`reference load project-tracker.contract` still loads it, with a `reference-renamed` warning
(cyber-agentkit 2.1 lets a `many` interface keep the name of the plain reference it replaces). The same `aliases` drive `reference migrate`, which renames a repository's or a user's `project-tracker.contract` file to the interface's name, so repobuddy ships no `_renames.yaml`. A capabilities reference declares `implements: project-tracker.capabilities@1`,
which `reference check` verifies against the interface's sections, with `Tracker` and `Detect`
required; repobuddy's references also keep `contract: 1` for skills older than the interface. A skill
reads `implements`, or `contract` when there is none, and stops on a missing or unknown value. Adding a section or an optional field keeps
the number; renaming or removing a section, or changing the item ref, raises it.

### Non-goals

- Scenarios for the epic and initiative templates and the contract's `Link`, `Retype`, and `Close` sections; the [epic](../epic/README.md) unit exercises them.
- The routing itself and the set-up skill: they are the [project-tracker](../project-tracker/README.md) unit. This unit owns only the table formats the contract holds.
- Capabilities for any tracker other than GitHub.
