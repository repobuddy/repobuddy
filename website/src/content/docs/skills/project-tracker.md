---
title: project-tracker
description: Record which tracker holds each level and category of work, and check the routing still resolves.
---

`project-tracker` writes down which issue tracker holds what, so [`issue`](/repobuddy/skills/issue/) files where your team decided. It stores the answer as the `project-tracker.routing` reference in `.agents/references/`.

## When to use

- "set up which tracker holds bugs and which holds epics"
- "send feature requests to a different tracker than bugs"
- "show me where issues get filed in this project"
- "check that my tracker routing still works"

## Invoke

Run `/project-tracker`, or ask in plain words. It has four modes: set up, show, change, and check.

## What it does

1. **Set up** lists the installed `project-tracker.capabilities.<tracker>` references, keeps the ones on a contract version it knows, and asks which tracker holds each level (issue, epic, initiative) and category (bug, feature, task).
2. It pins each choice as `<plugin>/project-tracker.capabilities.<tracker>`. A tracker your project defines itself is pinned by its bare name.
3. For each pair of trackers it asks what a move does to the source: `moved` (close it as moved, the default) or `mirror` (keep it open). It refuses a move from a private tracker to a public one, because a private tracker's details never go into a public one.
4. It shows the result in plain words and writes the routing only after you confirm.
5. **Show** and **Change** read and edit the routing. **Check** reports each route that is missing, ambiguous (a bare name two plugins ship), on an unknown contract version, or a level and category that no route covers.

## The routing file

`.agents/references/project-tracker.routing.md` has two tables. The first matching row of `Routes` wins, and `any` matches everything:

```md
## Routes

| Level | Category | Tracker |
|---|---|---|
| issue | bug | repobuddy/project-tracker.capabilities.github |
| any | any | acme-tools/project-tracker.capabilities.acme |

## Moves

| From | To | Source after the move |
|---|---|---|
| repobuddy/project-tracker.capabilities.github | acme-tools/project-tracker.capabilities.acme | mirror |
```

A pair with no `Moves` row means `moved`. The formats are defined in `project-tracker.contract`.

## Asks before acting

It never writes the routing without your confirmation, and check writes nothing. Without a routing, `issue` files on the tracker of the `origin` remote and suggests running this skill.
