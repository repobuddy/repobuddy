---
name: epic
description: "Plans, revises, reviews, or hands off an epic and its child issues; promotes an issue or demotes an initiative."
---

# Epic

Plans an epic (several independently shippable issues that together deliver one outcome), judges the plan against named criteria, and files it with its child issues. Changes an epic that exists, reviews one, and checks that one is ready to run unattended. Also moves work into the epic level: an issue that grew becomes an epic, and an initiative that lost its metric becomes one. When the epic level lives on another tracker than the item, the change becomes a move between trackers.

Use when asked to plan an epic, break work down into child issues, break down a shell epic an initiative named, re-scope, split, merge, or supersede an epic's children, move a child to another repository, review an epic, check that an epic is ready to hand off, write its run order, turn an issue into an epic, promote an issue, demote an initiative, or move an epic's work to the tracker that holds epics.

This skill does not file a single issue (that is `issue`), does not turn an epic into an issue or an initiative (the skill of the level being entered owns that: `issue` or `initiative`; say so and stop), and does not set up which tracker holds what (that is `project-tracker`). Never file a security vulnerability (a flaw that lets someone run code, or read or change data, they are not allowed to) as a public item: send it to the repository's private channel (a GitHub security advisory, or the contact in `SECURITY.md`) and stop. Check for this first, before any mode runs.

## Modes

| Mode | Use when | Source | Result | Steps |
|---|---|---|---|---|
| **Create** | new work is too big for one issue | none | a new epic and its child issues | [references/create.md](references/create.md) |
| **Revise** | an epic exists and its plan changes: re-scope it, split, merge, or supersede a child, move a child or a design issue to another repository, or fix its blockers | an epic | the epic and its children changed, its body in sync with its tree | [references/revise.md](references/revise.md) |
| **Review** | someone asks whether an epic, filed or drafted, is any good | an epic or a draft | a pass or fail for each planning criterion, read-only or fixed | [references/review.md](references/review.md) |
| **Handoff** | an epic is about to run unattended, by an agent fleet or a person who was not in the planning | an epic | a ready or not-ready verdict, and the run order in the epic's body | [references/handoff.md](references/handoff.md) |
| **Promote** | an existing issue turns out to be epic-sized | an issue | that issue as the epic, or a new epic on another tracker, with children | [references/promote.md](references/promote.md) |
| **Demote** | an existing initiative has no metric, or its epics are one outcome | an initiative | that initiative as an epic, or a new epic on another tracker, with each child epic decided one by one | [references/demote.md](references/demote.md) |

Pick the mode from the request, then read its steps file and follow it. A request to change an epic that exists is Revise, even when it reads like Create ("add a child to #40"). Asking whether an epic is complete enough to hand off is Handoff, not Review. With no mode clear, ask. A level change that crosses trackers also follows [references/moves.md](references/moves.md).

## References

Load these with the `reference` skill in the `cyber-agentkit` plugin, so a project's own override applies:

- Before any mode: `project-tracker.levels` (the level checks), `project-tracker.capabilities.interface` (what a capabilities reference holds, and the routing's format), and `project-tracker.template.epic` (the epic's body). When `project-tracker.capabilities.interface` does not load, read [references/project-tracker.capabilities.interface.md](references/project-tracker.capabilities.interface.md) in this skill's folder instead: it is the same interface, bundled for an install without the repobuddy plugin.
- For Create, Revise, Review, Handoff, and Promote: `project-tracker.criteria.epic` (the planning criteria, EP1 to EP14) and `project-tracker.executors` (what a person and an agent can do on this tracker, and which steps are irreversible).
- For Create and Revise: `research.method` (how the research step runs, and where its artifact lives).
- For Demote: `project-tracker.template.initiative`, to find the initiative's `Metric`.
- For a child filed without the `issue` skill: its category's template, `project-tracker.template.bug`, `project-tracker.template.feature`, or `project-tracker.template.task`.

When `reference` cannot run, read the bundled default from this skill's `references/` folder: `<name>.default.md`.

When a load warns `reference-legacy-format` or `reference-renamed`, a file is in a cyber-agentkit 1 form or under an old name: run `reference migrate` with the `reference` skill in the `cyber-agentkit` plugin, show the user its plan, and run it again with `--write` only on their yes. Then go on with the reference as loaded.

Keep every section of the epic template, in order. Write `None` under a section you have nothing for, or one EP12 says the epic does not need. A section a team adds or rewords is part of the template. Give every list item the ID the template shows (`K1`, `S1`, `N1`, `Q1`, `R1`, `D1`, `F1`). An ID is never reused: a removed item retires its ID, and a new item takes the next number.

## Guards

These hold on every tracker and cannot be changed by a capabilities reference or a team override:

- **Confirm before any write.** Show everything that will be created, retyped, linked, transferred, or closed, and wait for a yes. A capabilities section marked as writing in `project-tracker.capabilities.interface` never runs before it. The one exception is Create on trackers the user owns ([create.md](references/create.md) step 6): the plan is shown and filed without waiting. Revise, Promote, Demote, a Review that fixes a filed epic, a Handoff that writes the run order, and a move always wait for a yes, because they change an item that already exists.
- **List every child the change touches**, by title and URL, with what happens to each.
- **Never close a child as a duplicate.** An existing item that matches a planned child is attached, not closed.
- **Never drop a child silently.** Every child ends kept, re-parented, detached, transferred, or closed as not planned or superseded, and the report says which.
- **Never guess a decision into the plan.** A fix that needs a decision the user has not made goes under `Open questions` with its options and a recommendation.
- **A private tracker's details never go into a public one.** A public item names an item on a private tracker only as tracked internally, with no title or URL, wherever it would list or link it. A move from a private tracker to a public one stops (see [moves.md](references/moves.md)).
- **A failed create is checked before any retry.** Look for the item it may have left behind, as the reference's `Create` section says; when one is there, use it and do not retry.

## Trackers

A tracker's operations live in a capabilities reference named `project-tracker.capabilities.<tracker>`. This skill owns the workflow; the reference owns the commands. Resolve a tracker for a level and a category: the epic at level epic, each child at level issue with its own category, and a Promote or Demote source at its own level and category. Know the category first: a routing chooses by it. A source item given by URL is on the tracker whose `Url` section parses it; when that is not the tracker its route names, say so and stop.

1. Look for a routing: `reference load project-tracker.routing --format json`. Status `missing` means no routing: go to step 3. When the command cannot run, read `.agents/references/project-tracker.routing.md` directly: absent means no routing (go to step 3); present means its pins cannot be resolved, so name the first matching pin, say the `reference` command cannot run, suggest `project-tracker` check once it can, and stop.
2. With a routing, take the first `Routes` row that matches the level and the category. No row matches: name the pair, suggest `project-tracker` change, and stop. Run `reference load <pin> --format json --metadata` on its pin. Its status is `missing` or `ambiguous` (the bare name is held by more than one plugin): name the pin and the problem, suggest `project-tracker` check, and stop. Otherwise load that reference and go to step 6.
3. Read the host of `git remote get-url origin`.
4. List what is installed: `reference search project-tracker.capabilities`. Keep only hits whose `match` is `prefix`, which may carry a `<plugin>/` qualifier; drop the interface itself, `project-tracker.capabilities.interface`, and fuzzier ones.
5. Load the one whose `Detect` section matches the repository. Two matches, or a name ambiguous between plugins: report both qualified names, ask which, and load neither until answered. When the command cannot run, or nothing is left, load the bundled reference for the host from this skill's `references/` folder: `project-tracker.capabilities.github.default.md` for `github.com`, `project-tracker.capabilities.gitlab.default.md` for `gitlab.com` or a host `glab auth status --hostname <host>` accepts. Otherwise say that no tracker is set up for this repository, suggest `project-tracker`, and stop.
6. Read the version in the `metadata` of `reference load <name> --format json --metadata`, or in the frontmatter of a bundled reference: `implements` (`project-tracker.capabilities@<version>`), or `contract` when there is no `implements`. Missing, or not a version `project-tracker.capabilities.interface` declares: name the tracker and the version, and stop.
7. Run its `Detect` checks; when a tool is missing, old, or logged out, say what to install, upgrade, or run, and stop.
8. Check that the tracker holds the level (`Levels held` in its `Tracker` section). When it does not, say so and stop; do not file the epic as a plain issue.

Where the reference marks an operation `**Unsupported.**`: with no `Search`, the user confirms there is no duplicate; with no native `Link`, put the link in the body of the child, naming the parent; with no `Retype` for the change, create at the new level, link, and close the old item as moved after confirmation; with no `Ownership`, the ownership is unknown, so Create asks. With no `Board`, `Transfer`, `Depend`, or `Sync body`, follow its `Workaround:` line, or tell the user the step is theirs to do by hand, and list it in the report.

On GitHub, `scripts/epic-plan.mjs` in this skill's folder does the deterministic work: `graph` reads the blocked-by graph and its waves, `depend` batches blocker changes, `sync-body` rewrites the `Child Issues` list from the native tree, and `check` runs the tracker checks under [Validate](#validate). Each prints JSON. Run it as `node <this skill's folder>/scripts/epic-plan.mjs <command> --repo <owner>/<repo> ...`; a command that writes runs only with `--write`, after the confirmation.

## Plan

Create, Revise, and Promote settle the plan this way, and Review judges it the same way.

**Settle one section at a time,** in this order: outcome, key terms, research, scope and non-goals, open questions, children, dependencies, executors and irreversible steps, done-when. Each section is drawn from the ones before it, so a wrong outcome carries into every child. For each section:

1. Draft it from what the user said, the source item, and what you read. Re-read every id, count, URL, and owner from its system of record before you write it, and note where it came from under `Research and sources` (EP5). A value a subagent reported is a lead to re-read, not a source.
2. Judge the draft against the criteria `project-tracker.criteria.epic` lists under that section's heading.
3. Fix each failure the plan and its sources settle, and judge again. Repeat until nothing fails, or a round fixes nothing new. A fix that needs the user's decision goes under `Open questions` with its options and a recommendation (Guards).
4. Ask the user only what the section cannot be settled without: its open questions. Ask them together with the next section's, not one message per section. A section with no question needs no reply.

A change to an earlier section reopens every section after it. When every section passes, judge the whole plan against EP12 and EP14, and present it. Do not show a plan with a failure you could have fixed.

**Research.** Once the outcome and key terms are drafted, and before the scope is settled or any child is named, run the method `research.method` names on the idea, its feasibility, and prior art. The research can change the outcome: an existing tool may mean adopting or extending it instead of building, or a limit may cut a job. Go back to the outcome when it does, and record each change in the research artifact. Link the artifact under `Research and sources`, or record `Skipped: <reason>` there when the method's `Skip` rule applies (EP13).

**Run order.** Derive it from the blocked-by graph, never write it by hand: a child's wave is one more than the highest wave of the children that block it. An epic that is already filed gets it from `epic-plan.mjs graph`. Add the `Run order` table only when EP12 calls for one.

## What NOT to Do

- Do not write before the confirmation, except a Create whose every tracker answered `owned` with no level finding, no open question, and no missing label; do not touch a child the plan did not list
- Do not file a child before the outcome and done-when are settled, or guess an unknown into a child
- Do not file an undecided design as a delivery child: make it a spike or a separate design issue (EP6)
- Do not file an id, count, or URL you did not read yourself from its source
- Do not add or remove blocked-by links in a shell loop: use `Depend`
- Do not close a child as a duplicate, or drop one without saying where it went
- Do not invent labels, types, or fields: use only those the tracker has, and create a level label only on a yes
- Do not move anything from a private tracker into a public one
- Do not turn an epic into an issue or an initiative here

## Validate

Run these against the tracker after any mode that wrote, and in Review and Handoff. A cold reader runs the same checks later against the filed issues, not against your report. Each is pass or fail.

- [ ] V1. Every `Child Issues` line names a native child, every native child is listed, and the counts match (`epic-plan.mjs check`, `children`)
- [ ] V2. The run-order table, when there is one, matches the blocked-by graph: same blockers per child, every blocker in an earlier wave, every child in one row (`check`, `run-order`)
- [ ] V3. The blocked-by graph among the children is acyclic (`check`, `graph`)
- [ ] V4. When the routing or the user names a board, the epic and every child are on it (`check --project <title>`, `board`)
- [ ] V5. No link in the body points at a transferred or renamed item without a redirect note (`check`, `links`)
- [ ] V6. The URL of the epic and of each child was returned, and the report says what happened to every child the change touched
- [ ] V7. The description in this skill's frontmatter is at most 120 characters, and `name` equals the directory name

## Done when

Before reporting done, check each of these against the result. Report any that fails.

- **C1.** A request to plan or file a security vulnerability was pointed to the private channel, and nothing was searched or written.
- **C2.** No child was proposed before the outcome and the done-when were settled.
- **C3.** A review names, by ID, every planning criterion the plan fails, each with the line that fails it and the fix. A read-only review changed no file and wrote nothing to the tracker.
- **C4.** A plan that was presented or filed fails no planning criterion, except one listed under `Open questions` with its options and a recommendation.
- **C5.** Nothing was written to a tracker before the confirmation the Guards require.
- **C6.** Blocked-by links, the body's child list, and transfers were changed through the capabilities `Depend`, `Sync body`, and `Transfer` sections, never by a shell loop.
- **C7.** Handoff said ready only when V1 to V5 and EP7 to EP11 pass. Its run order lists each child's wave, executor, and blockers.
