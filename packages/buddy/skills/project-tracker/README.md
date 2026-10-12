# project-tracker

Records which issue tracker holds each kind of work, so [`issue`](../issue/README.md) files where your team decided instead of guessing. A team may keep bugs in GitHub issues and epics in a private tracker; this skill writes that down once, as the project's `project-tracker.routing` reference.

## When to use

- "set up which tracker holds bugs and which holds epics"
- "send feature requests to a different tracker"
- "show me where issues get filed in this project"
- "check that my tracker routing still works"

## What it does

- **Set up** lists the installed `project-tracker.capabilities.<tracker>` references, asks which tracker holds each level (issue, epic, initiative) and category (bug, feature, task), and pins each choice as `<plugin>/project-tracker.capabilities.<tracker>`. It also asks, for each pair of trackers, whether moving an item closes the source as moved or keeps it open as a mirror. It writes `.agents/references/project-tracker.routing.md` after you confirm.
- **Show** describes each route and move in plain words.
- **Change** edits the routes you name and keeps the rest.
- **Check** reports a route whose tracker is missing, held by two plugins, on a contract version the skill does not know, or a level and category that no route covers. It writes nothing.

Without a routing, `issue` files on the tracker of the `origin` remote and suggests running this skill. With one, `issue` files on the routed tracker.

## Safety

- It never writes the routing without your confirmation.
- A private tracker's details never go into a public one: it refuses a move policy from a private tracker to a public one.
- It does not file, move, or retype an item, and it writes no capabilities reference.

## Install

```sh
npx skills add repobuddy/repobuddy --skill project-tracker
```
