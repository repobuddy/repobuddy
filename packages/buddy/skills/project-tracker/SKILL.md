---
name: project-tracker
description: "Use this skill when setting up, showing, changing, or checking which tracker holds each kind of work."
---

# Project tracker

Records which issue tracker holds each level and category of work, so `issue`, `epic`, and `initiative` file where the team decided and never guess. The record is the project's `project-tracker.routing` reference. This skill writes and checks it; the level skills read it.

Use when asked to set up where issues go, route bugs and features to different trackers, show the tracker routing, change which tracker holds something, or check that the routing still works. This skill does not file, move, or retype an item (that is `issue` and `epic`), and it writes no capabilities reference for a tracker.

## References

Load these with the `reference` skill in the `cyber-agentkit` plugin:

- `project-tracker.contract`: the formats of the `Routes` and `Moves` tables (its `Routing` section), and which `contract:` versions it knows.
- `project-tracker.routing`: the project's current routing, when it exists.

When the `reference` command cannot run, say it is needed and stop: nothing can be listed or read, so write nothing.

## Modes

Pick the mode from the request. With none clear, ask. For show, change, and check: when `reference show project-tracker.routing` finds no routing, say none exists, offer set-up, and write nothing.

### Set up

1. When a routing exists, show it, offer **Change**, and write nothing.
2. List what is installed: run `reference search project-tracker.capabilities`. Keep only hits whose `match` is `prefix`; drop every other hit, such as `project-tracker.contract`.
3. Run `reference show <name> --format json` on each kept name and read `contract` in `metadata`. When it is missing or is not a version `project-tracker.contract` declares, leave that tracker out of the choices and say which one and why.
4. When nothing is left, say no capabilities reference is installed and write nothing.
5. Build a draft from what can be read, before asking anything. The draft picks only among the trackers kept in step 3; it never names one that is not installed. Read these signals:
   - **Host**: the host of `git remote get-url origin`, as `issue` Trackers step 3 reads it. The kept tracker whose `Detect` matches the host is the host's tracker.
   - **Linked**: for each kept tracker, whether its `Detect` section resolves a scope for this repository (for Asana, a configured project), as opposed to the tracker being installed only. Run only the checks `Detect` names and write nothing.
   - **What it holds**: the levels, categories, and visibility in its `Tracker` section, and the issue types its `Kinds` section reads. A level or category no tracker holds stays out of the draft.
   - **What the repo says**: a line in `AGENTS.md` or `CLAUDE.md` that names where work goes, such as "Use GitHub issues for feature planning by default". Count it only when it names a kept tracker.

   Show each route with the signal behind it, and say which kept trackers are installed but not linked. Ask a question only where signals conflict (a linked tracker and a different host tracker, or a repo line against the host) or say nothing (no host tracker, no linked tracker, no repo line); a route all signals agree on is not asked. Only one kept tracker matches and nothing conflicts: draft one catch-all route to it.
6. Ask only what the draft left open: which tracker holds each level and category where signals conflict or were silent. Read the visibility, levels, and categories each tracker holds from its `Tracker` section.
7. Pin each choice. A name that came back as `<plugin>/<name>` is already a pin; when two plugins ship the tracker, list both and ask which, then pin that one. A bare name: run `reference where <name>` and pin `<plugin>/<name>` from the `used` plugin slot. A tracker that only the project's own `.agents/references/` defines has no plugin: pin the bare name.
8. Ask what happens to the source when an item moves between each pair of routed trackers that has no `Moves` row yet: `moved` (close the source as moved) or `mirror` (keep it open). Offer `moved` as the default. Never ask for or write a row that moves an item from a private tracker to a public one (see `Routing` in `project-tracker.contract`): refuse that pair and say a private tracker's details do not go into a public one.
9. Show the routes and moves in plain words, with the signal behind each route, and ask for one confirmation covering the draft and the answers. When declined, write nothing and say so.
10. Write the content to a temporary file in the format `project-tracker.contract` gives (specific rows first, a catch-all last), then run `reference create project-tracker.routing --template <file>`. It writes `.agents/references/project-tracker.routing.md` and never overwrites.

A draft that `issue` hands over (one catch-all route to one tracker it already showed) needs no further question: re-run steps 2 to 4, check the draft's tracker is still among the kept ones, and when the user's yes to `issue`'s offer is on record, go to step 10 with no `Moves` rows. Otherwise run the steps in full.

### Show

Describe each route as a level and category going to a tracker, and each move as closing or keeping the source. Write nothing.

### Change

Ask which levels or categories change, then run set-up steps 2 to 9 for them: list the trackers again, ask only about the levels and categories named, and ask the move policy only for pairs with no row yet. Write the whole routing back with every route and move the user did not touch unchanged: `reference create` never overwrites, so replace the file at the project slot's path that `reference where project-tracker.routing` prints.

### Check

Write nothing. Walk every route: run `reference show <pin> --format json` and note each problem with its route and pin, without stopping at the first. Then check coverage once. Report all the notes together:

- **missing**: exit 1 with `no reference named`.
- **ambiguous**: exit 1 with `held by more than one plugin`; list both qualified names.
- **unknown contract**: `contract` in `metadata` is missing or not a version `project-tracker.contract` declares; name the tracker and the version.
- **uncovered**: a level and category (any of issue, epic, initiative with bug, feature, task) that no route matches.
- **stale**: a route that the signals in set-up step 5 no longer support. Re-read them and report: a route to a tracker whose `Detect` no longer resolves a scope for this repository (for Asana, the project link was removed), or a catch-all route to a tracker other than the host's while no other signal supports it, such as a pinned host tracker that no longer matches `origin`. Name the route and the signal that changed. Report it as a note only: the routing may be deliberate.

When there are none, say the routing is clean. Suggest **Change** for any problem.

## What NOT to Do

- Do not file, move, or retype an item
- Do not write a capabilities reference for a tracker
- Do not name a tracker yourself: draft only among the installed capabilities references, and only with confirmation
- Do not write the routing without the user's confirmation
- Do not write a move from a private tracker to a public one

## Validate

- [ ] The description in the frontmatter is at most 120 characters, and `name` equals the directory name
- [ ] Every copy in this skill's `references/` equals the file of the same name in `packages/buddy/references/` (`node scripts/sync-skill-references.mjs --check`)
- [ ] Trackers were listed by the `project-tracker.capabilities` prefix and only `match: prefix` hits were kept
- [ ] The draft named only trackers from the kept installed references, each route with its signal
- [ ] No routing file was written without the user's confirmation, and no question was asked about a route all signals agreed on
- [ ] No `Moves` row goes from a private tracker to a public one
- [ ] Check wrote no file, and reported a stale route as a note
