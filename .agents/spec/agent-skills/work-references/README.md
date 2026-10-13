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
ship in `packages/buddy/references/`, the plugin tier agent-harness resolves
([ADR 0003](../../design/decisions/0003-split-file-issue-by-level.md), decision 5).

## Subject

| Reference | Holds | Headings that are API |
|---|---|---|
| `repobuddy.work-levels` | the level checks | one `##` per level (Issue, Epic, Initiative), each with `### Is`, `### Done when`, `### Too big`, `### Too small` |
| `repobuddy.work-template.bug`, `.feature`, `.task` | a body template for a category | the `##` sections of the template |
| `repobuddy.work-template.epic`, `.initiative` | a body template for a level | the `##` sections of the template |
| `project-tracker.contract` | the sections a capabilities reference must have, the `**Unsupported.**` marker, the item ref, the contract version, and the format of `project-tracker.routing` (its `Routes` and `Moves` tables) | `Version`, `Sections`, `Unsupported`, `Item ref`, `Overrides`, `Routing` |

**Headings are API.** A team overrides text with `merge: merge-sections`, so renaming a heading breaks
every override of it and needs a changeset. The resolver matches and replaces a whole `##` section
and appends one the base lacks (run against the real resolver with a project override over a plugin
copy). In a template, a `##` is one section, so an override restates just that one. In
`repobuddy.work-levels` a `##` is a whole level: an override of one level restates all four of its
`###` parts (Is, Done when, Too big, Too small), or the level loses the ones it leaves out.

**One canonical copy.** The file in `packages/buddy/references/` is the source. A skill also carries
a copy of each reference its `SKILL.md` names in backticks, because Skills CLI installs copy only a
skill's folder and the `reference` skill reads the caller's copy when the command cannot run.
`scripts/sync-skill-references.mjs` writes the copies, and `--check` (a `verify` task) fails when one is
stale, missing, or no longer named. The script and `verify` own that rule; no scenario repeats it.
The GitHub capabilities reference belongs to the [issue](../issue/README.md) unit, which names it.

**Contract versions.** `project-tracker.contract` is version 1. A capabilities reference declares
`contract: 1`; a skill stops on a missing or unknown value. Adding a section or an optional field keeps
the number; renaming or removing a section, or changing the item ref, raises it.

### Non-goals

- Scenarios for the epic and initiative templates and the contract's `Link`, `Retype`, and `Close` sections; the [epic](../epic/README.md) unit exercises them.
- The routing itself and the set-up skill: they are the [project-tracker](../project-tracker/README.md) unit. This unit owns only the table formats the contract holds.
- Capabilities for any tracker other than GitHub.
