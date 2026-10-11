# 0003 — Split `file-issue` into `issue`, `epic`, and `initiative`, by level

**Status:** accepted (2026-10-11), not yet implemented
**Context:** `file-issue` files a bug or feature request on GitHub or GitLab. The goal is to file any
kind of tracked work, on any tracker, with teams able to adjust the details.

## Decision

1. **Kind has two axes.** **Category** says why the work exists: bug, feature, task. **Level** says
   how much structure it needs: issue, epic, initiative. A feature can be issue-sized or epic-sized.
2. **One routing skill per level**, named noun-first ([0002](./0002-routing-skills-are-named-noun-first.md)).
   Each owns entry into its level:

   | Skill | Creates | Promotes into it | Demotes into it | Creates children through |
   |---|---|---|---|---|
   | `issue` | one item of any category | — | epic → issue | — |
   | `epic` | an epic and its issues | issue → epic | initiative → epic | `issue` |
   | `initiative` | an initiative and its epics, as shells | epic → initiative | — | `epic` |

3. **The levels are defined by checks, not by size words.** These are the defaults; a team overrides
   them through a reference.

   | Level | Is | Done when |
   |---|---|---|
   | issue | one deliverable, one owner, ships in one or a few PRs within an iteration | it ships |
   | epic | several independently shippable issues that together deliver one outcome | its children are done |
   | initiative | several epics aimed at a measurable goal, across teams or quarters | the goal's metric is met |

4. **The tracker is injected.** The skills own the workflow: gather, check for duplicates, confirm,
   create, report. An **adapter** supplies the operations: `detect`, `kinds`, `search`, `create`,
   `link`, `promote`, `url`. GitHub and GitLab adapters are built in; a tracker package such as
   `cyber-asana` ships its own as the reference `cyber-asana.tracker-adapter`. The adapter is
   chosen by the tracker the user names, then the `repobuddy.work-tracker` reference (which may
   route by kind, e.g. bugs to GitHub, initiatives to Asana), then the git remote.
5. **Customization goes through `@cyberuni/agent-harness` references.** repobuddy ships the
   defaults, prefixed with its plugin name as every plugin-shipped reference must be:

   | Reference | Holds |
   |---|---|
   | `repobuddy.work-tracker` | the adapter choice and routing by kind |
   | `repobuddy.work-levels` | the level checks |
   | `repobuddy.work-template.<kind>` | one body template per category or level: `bug`, `feature`, `task`, `epic`, `initiative` |
   | `<plugin>.tracker-adapter` | one tracker's operations, shipped by the tracker's package |

   A name uses dots, never `/`: agent-harness reads `a/b` as reference `b` in plugin `a`. A team
   overrides a default by writing the same name to `.agents/references/`, with `merge: merge-sections`
   to replace only the sections it redefines.
6. **A security vulnerability is never filed as a public issue.** It goes to the repository's
   private channel (a GitHub security advisory, or the contact in `SECURITY.md`).

## Why

- **Split where the steps differ, not where the fields differ.** Bug, feature, and task share every
  step; only the template and a conditional step or two differ. One skill per category would collide
  on triggers ("make a ticket for this" fits all three) and copy the adapter, duplicate check, and
  confirmation into each. Epic and initiative have their own steps. An epic is scoped, then broken
  into issues. An initiative sets a goal and its metric, then names epics as shells and leaves their
  breakdown for later.
- **Two axes make promotion simple.** A feature that grows is promoted from issue to epic and stays a
  feature. On one axis, "feature" and "epic" are rival types and promotion is a type change.
- **Frameworks disagree on the words.** SAFe treats "feature" as a level (epic > capability >
  feature > story); Jira practice treats it as a category. Checks that a team can override hold up
  where size words do not.
- **The workflow is the same on every tracker; the operations are not.** In GitHub, an epic is a
  parent issue with sub-issues. In Linear it is a project, a different object, and an issue cannot
  be promoted in place. Putting the differences in an adapter keeps one copy of the workflow.

## Names considered for `issue`

| Name | Rejected because |
|---|---|
| `work-item` | Too generic and abstract, though Azure DevOps and Jira use the term |
| `ticket` | Suggests support desks and bugs |
| `task` | Also a category in this model, and agent harnesses use "task" for their own to-dos and subagents |
| `story` | A category in agile practice; bugs are not stories |
| `card` | Tied to kanban boards |
| `file-issue` | "file" reads as the file system in an identifier, and the skill is now a router |

`issue` won because GitHub, GitLab, and Linear name the object that way, and Jira did until 2025.
Asana's "task" and other trackers' terms go in the skill's description as triggers.

**"Project" is not used as a level.** It already names a Claude Code project (a coordinating
conversation over parallel sessions, with no tracker integration), a Linear project (about an epic),
an Asana project (a container), and GitHub Projects (a board). Adapters map to those objects; the
skills' own vocabulary does not claim the word.

## Scope

The skills file **tracked work that comes out of this repository**: a record with a lifecycle (open
to done) and an owner. The repository picks the default tracker and supplies the context. Out of
scope: a tax return (a submission to an authority) and a marketing report (a document, which could
be attached to an issue). `initiative` sits at the edge of
[`packages/buddy/GOALS.md`](../../../../packages/buddy/GOALS.md), since a goal across teams and
quarters is not a repository chore. It is built last, once there is a real initiative to test it on,
and may live in a tracker or planning package instead.

## Consequences

- Build order: rename `file-issue` to `issue` with categories and the built-in adapters, then move
  the templates into references, then ship the first external adapter (`cyber-asana`), then `epic`
  with promotion, then `initiative`.
- Renaming `file-issue` breaks anyone who invokes it by name; the changeset says so.
- [`posting-skill-boundaries.md`](../posting-skill-boundaries.md), the glossary, and
  [0001](./0001-to-question-owns-composition-not-delivery.md) name `file-issue` as the owner of the
  create path. The first two are updated when the rename ships; 0001 stays as written.
- `issue` only *suggests* a different level when an item looks too big or too small. Promotion and
  demotion run in the skill of the level being entered, because they mean breaking work down or
  folding it back.
