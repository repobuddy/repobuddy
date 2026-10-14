---
name: epic
description: "Use this skill when planning an epic and its child issues, promoting an issue to an epic, or demoting an initiative."
---

# Epic

Plans an epic (several independently shippable issues that together deliver one outcome) and files it with its child issues. Also moves work into the epic level: an issue that grew becomes an epic, and an initiative that lost its metric becomes one. When the epic level lives on another tracker than the item, the change becomes a move between trackers.

Use when asked to plan an epic, break work down into child issues, turn an issue into an epic, promote an issue, demote an initiative, or move an epic's work to the tracker that holds epics.

This skill does not file a single issue (that is `issue`), does not turn an epic into an issue or an initiative (the skill of the level being entered owns that: `issue` or `initiative`; say so and stop), and does not set up which tracker holds what (that is `project-tracker`). Never file a security vulnerability (a flaw that lets someone run code, or read or change data, they are not allowed to) as a public item: send it to the repository's private channel (a GitHub security advisory, or the contact in `SECURITY.md`) and stop. Check for this first, before any mode runs.

## Modes

| Mode | Use when | Source | Result |
|---|---|---|---|
| **Create** | new work is too big for one issue | none | a new epic and its child issues |
| **Promote** | an existing issue turns out to be epic-sized | an issue | that issue as the epic, or a new epic on another tracker, with children |
| **Demote** | an existing initiative has no metric, or its epics are one outcome | an initiative | that initiative as an epic, or a new epic on another tracker, with each child epic decided one by one |

Pick the mode from the request. With none clear, ask.

## References

Load these with the `reference` skill in the `cyber-agent-harness` plugin, so a project's own override applies:

- Before any mode: `repobuddy.work-levels` (the level checks), `project-tracker.contract` (what a capabilities reference holds, and the routing's format), and `repobuddy.work-template.epic` (the epic's body).
- For Demote: `repobuddy.work-template.initiative`, to find the initiative's `Metric`.
- For a child filed without the `issue` skill: its category's template, `repobuddy.work-template.bug`, `repobuddy.work-template.feature`, or `repobuddy.work-template.task`.

Keep every section of the epic template, in order; write `None` under one you have nothing for. A section a team adds or rewords is part of the template.

## Guards

These hold on every tracker and cannot be changed by a capabilities reference or a team override:

- **Confirm before any write.** Show everything that will be created, retyped, linked, or closed, and wait for a yes. A capabilities section marked as writing in `project-tracker.contract` never runs before it.
- **List every child the change touches**, by title and URL, with what happens to each.
- **Never close a child as a duplicate.** An existing item that matches a planned child is attached, not closed.
- **Never drop a child silently.** Every child ends kept, re-parented, detached, or closed as not planned, and the report says which.
- **A private tracker's details never go into a public one.** A public item names an item on a private tracker only as tracked internally, with no title or URL, wherever it would list or link it. A move from a private tracker to a public one stops (see Moves).
- **A failed create is checked before any retry.** Look for the item it may have left behind, as the reference's `Create` section says; when one is there, use it and do not retry.

## Trackers

A tracker's operations live in a capabilities reference named `project-tracker.capabilities.<tracker>`. This skill owns the workflow; the reference owns the commands. Resolve a tracker for a level and a category: the epic at level epic, each child at level issue with its own category, and a Promote or Demote source at its own level and category. Know the category first: a routing chooses by it. A source item given by URL is on the tracker whose `Url` section parses it; when that is not the tracker its route names, say so and stop.

1. Look for a routing: `reference show project-tracker.routing`. When it finds none, go to step 3. When the command cannot run, read `.agents/references/project-tracker.routing.md` directly: absent means no routing (go to step 3); present means its pins cannot be resolved, so name the first matching pin, say the `reference` command cannot run, suggest `project-tracker` check once it can, and stop.
2. With a routing, take the first `Routes` row that matches the level and the category. No row matches: name the pair, suggest `project-tracker` change, and stop. Run `reference show <pin> --format json` on its pin. It finds nothing, or says the bare name is held by more than one plugin: name the pin and the problem, suggest `project-tracker` check, and stop. Otherwise load that reference and go to step 6.
3. Read the host of `git remote get-url origin`.
4. List what is installed: `reference search project-tracker.capabilities`. Keep only hits whose `match` is `prefix`, which may carry a `<plugin>/` qualifier; drop fuzzier ones such as `project-tracker.contract`.
5. Load the one whose `Detect` section matches the repository. Two matches, or a name ambiguous between plugins: report both qualified names, ask which, and load neither until answered. When the command cannot run, or nothing is left, and the host is `github.com`, load `project-tracker.capabilities.github` from this skill's `references/` folder. Otherwise say that no tracker is set up for this repository, suggest `project-tracker`, and stop.
6. Read `contract:` in the reference's frontmatter. Missing, or not a version `project-tracker.contract` declares: name the tracker and the version, and stop.
7. Run its `Detect` checks; when a tool is missing, old, or logged out, say what to install, upgrade, or run, and stop.
8. Check that the tracker holds the level (`Levels held` in its `Tracker` section). When it does not, say so and stop; do not file the epic as a plain issue.

Where the reference marks an operation `**Unsupported.**`: with no `Search`, the user confirms there is no duplicate; with no native `Link`, put the link in the body of the child, naming the parent; with no `Retype` for the change, create at the new level, link, and close the old item as moved after confirmation.

## Create

1. **Outcome first.** Ask for the outcome (one sentence: what is true when this is done) and how anyone will know it is done. Ask for the category (bug, feature, task) when it is not clear. Then the scope and the non-goals. Do not name a child before the outcome and done-when are settled.
2. **Level check.** Read the epic level's `Too big` and `Too small` in `repobuddy.work-levels`. Too big: suggest an initiative (the `initiative` skill when it is installed). Too small: suggest an issue (the `issue` skill). Only suggest; continue at this level when the user does not change it.
3. **Audit for gaps.** List what is decided and what is not known yet. Each unknown becomes a **spike**: a child task titled `Spike: <question>`, whose done-when is a written answer, ordered before the children that depend on it. Do not guess an answer into a child.
4. **Break it down.** Propose child issues, each independently shippable with one owner, each with a title, a category, and a one-line done-when. Run each through the issue level's `Too big` check; a child that meets it is split or named as a spike. Ask for the owner's priority and order the children by it. Then try one setup other than the default (another tracker for some category, or a team that overrides a step) against the breakdown, and add a child when that setup needs one.
5. **Trackers.** Resolve the epic's tracker, and each child's. A child on another tracker than the epic cannot be a native child; it is linked in its body and listed in the epic's body, by title, or as tracked internally when the epic is public and the child's tracker private.
6. **Search for duplicates.** Run the epic tracker's `Search` at least twice for the epic (the full title, then the core noun and verb), and once for each child on that child's tracker. Show each hit (title, state, URL, level). A hit the user says is the epic: stop and offer Promote (an issue) or Demote (an initiative) on it. A hit the user says is a child: attach it instead of creating it.
7. **Confirm.** Run each tracker's `Kinds`, and the level-label check its `Retype` Limits give, when it gives one. Show the epic (title, category, outcome, non-goals, done-when, tracker, and the level label or field it uses), each child in order (title, category, spike or not, tracker, created or attached), and, on its own line, any level label that is missing and will be created. Ask once for the whole plan. Do not create anything without it; a missing label is created, with the reference's command, only on a yes to that line.
8. **Create the epic.** Run its tracker's `Create` at level epic, with the body written to a file from `repobuddy.work-template.epic`. Under `Child Issues`, list the planned children by title, as the Guards allow; the tracker's native link carries their numbers.
9. **Create the children.** Create each child, in order, through the `issue` skill when it is installed, passing the title, category, body, tracker, and the epic as parent, and saying the search and the confirmation are done; otherwise run the child tracker's `Create` with its template reference (`repobuddy.work-template.<category>`) and the epic as parent. Attach each existing match with the `Link` section. After a failed create, follow the Guards before the next child.
10. **Read back.** Read the epic's tree with the `Link` section and compare the count with the plan. Report any child that is missing.
11. **Report.** The epic's URL, then each child's URL in order, marking spikes and attached items, and anything not filed with why.

## Promote (issue → epic)

1. **Read the issue.** Parse its URL or number with the source tracker's `Url`, and read its title, body, state, category, and level. When its level is not issue, say what it is and stop. When it is closed, ask before going on.
2. **Level check.** Read the issue level's `Too big` in `repobuddy.work-levels`. When the issue does not meet it, say so and ask whether to go on.
3. **Plan.** Run Create steps 1, 3, and 4, starting from the issue's own text: its outcome becomes the epic's, and its acceptance criteria (`Done when`, `Expected`, a checklist) move into a **first child**, so the epic keeps one done-when, its children's.
4. **Where the epic lives.** Resolve the tracker for level epic and the issue's category. The same tracker as the issue: retype in place. Another tracker: a move; run Moves step 1 now, before any search, so a private item's text never reaches a public tracker.
5. **Search for duplicates** for each new child, as in Create step 6.
6. **Confirm.** Show what the retype does, read from the reference's `Retype` row for issue → epic (in place or a new item, the steps, the limits), or from Moves; the epic's new body; and each child, the first one with the moved criteria. A row that is silent or unsupported means: create the epic, link the issue, and close it as moved.
7. **Retype.** In place: run the row's steps, and rewrite the body from the epic template when the row says how; when it does not, leave the body and say the criteria are now in the first child. On another tracker: run Moves.
8. **Create the children**, read back, and report, as Create steps 9 to 11. The report says whether the epic kept the issue's URL.

## Demote (initiative → epic)

1. **Read the initiative.** Parse it with the source tracker's `Url`; read its body and its child epics (the `Link` section's tree). When its level is not initiative, say what it is and stop. When the tracker holds no initiative level, say so and stop.
2. **Warn about the metric.** Quote the `Metric` section from its body and say an epic has no metric, so it is dropped. Ask whether to keep the text under the epic's `Non-goals` or `Scope` as a note; never carry it as the done-when.
3. **Level check.** Read the initiative level's `Too small` in `repobuddy.work-levels`. When the initiative meets none of it, say so and ask whether to go on.
4. **Ask about each child epic, one by one.** Show its title, URL, state, and open children. Offer what the reference's `Retype` row for initiative → epic allows: keep it attached as the row says, or detach it to stand alone as an epic. When the user wants it folded in as an issue, that is an epic → issue change: say it belongs to `issue` and leave the child attached until then. A child epic is never closed by this mode.
5. **Where the epic lives.** Resolve the tracker for level epic and the initiative's category; the same tracker retypes in place, another is a move (run Moves step 1 now).
6. **Confirm.** Show the retype (in place or new item, the steps, the limits), the new body (from `repobuddy.work-template.epic`, without the `Metric` section, with the note from step 2 if kept), and every child epic with what happens to it. Wait for a yes.
7. **Retype.** Run the row's steps, rewriting the body when the row says how (when it does not, say the `Metric` section is still in the body), and each child's detach; or Moves.
8. **Read back and report.** The epic's URL, each child epic with what happened to it, and the dropped metric.

## Moves

A level change crosses trackers when the routing puts the epic level on another tracker than the source item. Retype cannot be in place then.

1. **Read the policy.** Find the `Moves` row whose `From` is the source tracker's pin and `To` the target's. No row means `moved`. Read each tracker's `Visibility` from its `Tracker` section. Private source and public target: stop, with or without a row, and say a private tracker's details never go into a public one.
2. **Confirm** as the mode says, adding: the item to be created on the target, what happens to the source (`moved`: closed as moved; `mirror`: kept open and linked), and every child of the source, with where it stays.
3. **Create** the item at level epic on the target tracker, from the source's text, with a link back to the source in its body.
4. **Link the source.** Comment on the source with the new item's URL. When the source is public and the target private, the comment says only that the work is tracked internally, with no title or URL.
5. **Source after the move.** `moved`: run the source tracker's `Close` with the reason moved. `mirror`: leave it open.
6. **Children.** A child of the source stays where it is. Link each open one from the new item's body (a public new item names a private child only as tracked internally). Re-parent a child only when the target tracker can hold it natively and the user asked. Never close one.

## What NOT to Do

- Do not write before the confirmation, or touch a child the confirmation did not list
- Do not file a child before the outcome and done-when are settled, or guess an unknown into a child
- Do not close a child as a duplicate, or drop one without saying where it went
- Do not invent labels, types, or fields: use only those the tracker has, and create a level label only on a yes
- Do not move anything from a private tracker into a public one
- Do not turn an epic into an issue or an initiative here

## Validate

- [ ] The description in the frontmatter is at most 120 characters, and `name` equals the directory name
- [ ] Every copy in this skill's `references/` equals the file of the same name in `packages/buddy/references/` (`node scripts/sync-skill-references.mjs --check`)
- [ ] The request was checked for a security vulnerability before any mode ran
- [ ] The level checks, the contract, and the epic template were loaded, and each capabilities reference's `contract:` was checked
- [ ] With a routing, every tracker came from a route, and a missing or ambiguous pin or an unmatched route stopped the skill before any search
- [ ] Create asked for the outcome and done-when before naming a child, and each unknown became a spike
- [ ] No write ran without the user's confirmation, and the confirmation listed every child the change touched
- [ ] No child was closed as a duplicate, and the report says what happened to every child
- [ ] A move from a private tracker to a public one stopped, and a public item names a private one only as tracked internally
- [ ] The URL of the epic and of each child was returned
