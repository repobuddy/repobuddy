# 0003 — Split `file-issue` into `issue`, `epic`, and `initiative`, by level

**Status:** accepted (2026-10-11), revised the same day; not yet implemented
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

4. **The tracker is injected, and discovered rather than named.** The skills own the workflow:
   gather, check for duplicates, confirm, create, report. A tracker's **capabilities** reference
   supplies the operations: `detect`, `kinds`, `search`, `create`, `link`, `retype`, `close`, `url`,
   one section each. `retype` moves an item up or down a level and says whether it did so in place;
   `close` closes with a reason (done, not planned, moved). The reference also declares the levels
   and categories the tracker holds and whether it is public or private. An operation the tracker
   lacks is marked unsupported, and the skill applies a generic fallback: no search means the user
   confirms there is no duplicate; no native link means a link in the body. Retype is not generic;
   see 7.

   Every provider ships its capabilities under one shared, unprefixed name,
   **`project-tracker.capabilities.<tracker>`**, so the consumer never needs to know which package
   provides a tracker. repobuddy ships `.github` and `.gitlab`; `cyber-asana` ships `.asana`; a team
   writes its own in `.agents/references/`. The skills find what is installed by listing that
   prefix, so a new tracker appears without any change to repobuddy. Two plugins shipping the same
   tracker resolve as ambiguous, and the choice is pinned as `<plugin>/project-tracker.capabilities.<tracker>`.
   Bitbucket has no capabilities reference: its native issue tracker is gone, so it routes to Jira.
5. **Customization goes through `@cyberuni/agent-harness` references.**

   | Reference | Owner | Holds |
   |---|---|---|
   | `project-tracker.capabilities.<tracker>` | each provider | one tracker's operations, levels, categories, and visibility |
   | `project-tracker.routing` | the project, written by the `project-tracker` skill | which tracker holds each level and category, and the policy for moving between trackers |
   | `project-tracker.contract` | repobuddy, until a second consumer needs it | the sections a capabilities reference must have, with a version |
   | `repobuddy.work-levels` | repobuddy | the level checks |
   | `repobuddy.work-template.<kind>` | repobuddy | one body template per category or level: `bug`, `feature`, `task`, `epic`, `initiative` |

   The `project-tracker.*` names are an interface several packages implement, so they are shared
   and unprefixed; the `repobuddy.*` names are this package's policy and carry its prefix. A name
   uses dots, never `/`: agent-harness reads `a/b` as reference `b` in plugin `a`. A team overrides a
   reference by writing the same name to `.agents/references/`, with `merge: merge-sections` to
   replace only the sections it redefines, or add one the default lacks. Over a tracker that two
   plugins ship, the override must use the qualified name.
6. **A security vulnerability is never filed as a public issue.** It goes to the repository's
   private channel (a GitHub security advisory, or the contact in `SECURITY.md`).
7. **How an item changes level is the tracker's, and a team can override it.** Trackers differ in
   whether a level change is in place (a GitHub label, an Asana parent task) or makes a new object
   (a Linear project, a GitLab epic), in their limits (GitHub: 100 children, 8 levels; GitLab:
   nested epics need Ultimate), and in what can happen to the children. So the capabilities reference's `Retype`
   section states, for each of issue → epic, epic → initiative, epic → issue, and initiative →
   epic: in place or a new item; what happens to open children (kept, re-parented, folded into a
   checklist, closed as not planned); and the limits. A team overrides that section with
   `merge-sections`, for example to keep sub-issues when an epic is demoted. The skill keeps the
   steps and the guards no tracker or team may change: confirm before any write, list every child
   the change touches, never close a child as a duplicate, and never drop a child without saying
   where it went. Where the reference is silent, the skill uses its default: create at the new level,
   link, and close the old item after confirmation.
8. **A `project-tracker` skill sets the trackers up.** It is a routing skill
   ([0002](./0002-routing-skills-are-named-noun-first.md)) with modes to set up, show, change, and
   check the routing. Set-up lists the installed capabilities, asks which tracker holds each level
   and category, and writes `project-tracker.routing` with each choice pinned to its plugin. A
   team may use GitHub issues for bugs, GitHub Discussions for feature requests, and a private
   Linear for epics and initiatives. `issue`, `epic`, and `initiative` read the routing and never
   guess; with no routing they fall back to the git remote's tracker and suggest running set-up.
   Check reports a route whose capabilities reference is missing, ambiguous, or on a contract
   version the skills do not know.
9. **A level change may cross trackers, and visibility only flows downhill.** When the level being
   entered lives in another tracker (a GitHub bug promoted to an epic in Linear), retype cannot be
   in place: the skill creates the item in the target tracker, links the two, and closes the source
   as moved, or keeps it open as a mirror if the routing says so. The routing holds that policy per
   pair of trackers. A private tracker's details never go into a public one: a public item that
   moved to a private tracker says only that it is tracked internally, with no title or URL, while
   the private item links back to the public one freely.

## Why

- **Split where the steps differ, not where the fields differ.** Bug, feature, and task share every
  step; only the template and a conditional step or two differ. One skill per category would collide
  on triggers ("make a ticket for this" fits all three) and copy the tracker operations, duplicate check, and
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
  be promoted in place. Putting the differences in a capabilities reference keeps one copy of the workflow.

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
an Asana project (a container), and GitHub Projects (a board). Capabilities references map to those
objects; the skills' own vocabulary does not claim the word as a level. The `project-tracker`
namespace uses it in its common sense, the category of tool, which does not collide with a level.

## Scope

The skills file **tracked work that comes out of this repository**: a record with a lifecycle (open
to done) and an owner. The repository picks the default tracker and supplies the context. Out of
scope: a tax return (a submission to an authority) and a marketing report (a document, which could
be attached to an issue). `initiative` sits at the edge of
[`packages/buddy/GOALS.md`](../../../../packages/buddy/GOALS.md), since a goal across teams and
quarters is not a repository chore. It is built last, once there is a real initiative to test it on,
and may live in a tracker or planning package instead.

## Consequences

- **On GitHub, the issue type carries the category and a label carries the level.** An epic is an
  issue labelled `epic` with sub-issues; an initiative is labelled `initiative` with epics as
  sub-issues. Retyping changes the label, in place. Issue types exist only in organizations, so a
  user-owned repository falls back to the `bug` and `enhancement` labels for the category.
- **On GitLab, epics need Premium.** On the Free tier GitLab's capabilities fall back to a labelled issue
  with tasks.
- The spike reports behind these points are linked from
  [`.agents/plans/issue-epic-initiative.plan.md`](../../../plans/issue-epic-initiative.plan.md).

- Build order, GitHub and Asana first: rename `file-issue` to `issue` with categories and GitHub's
  capabilities, then move the templates into references and write the contract, then the
  `project-tracker` skill, then `cyber-asana`'s capabilities, then `epic` with level changes on
  both, then GitLab's capabilities, then `initiative`. Other trackers (Linear, Jira, GitHub
  Discussions) follow, written by whoever needs them: a team in `.agents/references/`, a tracker
  package, or repobuddy when demand shows.
- Discovery lists a name prefix. agent-harness `reference search <prefix>` already tags such hits
  `match: prefix`, alongside fuzzier matches the skill must drop; a `reference list <glob>` in
  agent-harness would make that exact.
- Renaming `file-issue` breaks anyone who invokes it by name; the changeset says so.
- [`posting-skill-boundaries.md`](../posting-skill-boundaries.md), the glossary, and
  [0001](./0001-to-question-owns-composition-not-delivery.md) name `file-issue` as the owner of the
  create path. The first two are updated when the rename ships; 0001 stays as written.
- `issue` only *suggests* a different level when an item looks too big or too small. Promotion and
  demotion run in the skill of the level being entered, because they mean breaking work down or
  folding it back.
