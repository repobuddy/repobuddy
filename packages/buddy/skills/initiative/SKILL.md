---
name: initiative
description: "Use this skill when setting an initiative's goal and metric with its epics as shells, or promoting an epic to one."
---

# Initiative

Sets up an initiative (several epics aimed at a measurable goal, across teams or quarters): its goal, one metric with a baseline and a target, and its epics as **shells**. A shell is an epic with a title, an owner, and a one-line outcome and no child issues yet; its breakdown is left to `epic`. Also promotes an epic to an initiative by creating the initiative as a new parent above it, with the epic as its first shell.

Use when asked to plan an initiative, set a goal with a metric and the epics that move it, turn an epic into an initiative, or promote an epic.

This skill does not break an epic into issues (that is `epic`, for a shell as for any epic), does not file a single issue (that is `issue`), does not turn an initiative into an epic (that is `epic`; say so and stop), and does not set up which tracker holds what (that is `project-tracker`). It records the metric; it does not measure it, report its progress, or run the reviews. Never file a security vulnerability (a flaw that lets someone run code, or read or change data, they are not allowed to) as a public item: send it to the repository's private channel (a GitHub security advisory, or the contact in `SECURITY.md`) and stop. Check for this first, before any mode runs.

## Modes

| Mode | Use when | Source | Result |
|---|---|---|---|
| **Create** | a goal with a metric needs several epics | none | a new initiative and its shell epics |
| **Promote** | an existing epic turns out to aim at a measurable goal | an epic | a new initiative above that epic, the epic unchanged as its first shell, and any other shells |

Pick the mode from the request. With none clear, ask.

## References

Load these with the `reference` skill in the `cyber-agentkit` plugin, so a project's own override applies:

- Before any mode: `repobuddy.work-levels` (the level checks), `project-tracker.contract` (what a capabilities reference holds, and the routing's format), and `repobuddy.work-template.initiative` (the initiative's body).
- For each shell: `repobuddy.work-template.epic`.

Keep every section of a template, in order; write `None` under one you have nothing for. A section a team adds or rewords is part of the template.

## Guards

These hold on every tracker and cannot be changed by a capabilities reference or a team override:

- **Confirm before any write.** Show everything that will be created or linked, and wait for a yes. A capabilities section marked as writing in `project-tracker.contract` never runs before it.
- **No metric, no initiative.** An initiative has one measure with a target. Never guess a baseline or a target: an unknown baseline is written as `unmeasured`, and measuring it becomes the first shell.
- **A shell stays a shell.** Never propose, ask for, or file a shell's child issues here. A promoted epic keeps its body, its children, and its URL.
- **List every epic the change touches**, by title and URL, with what happens to each.
- **Never close an epic.** An existing epic that matches a planned shell is attached, not closed or duplicated.
- **A private tracker's details never go into a public one.** A public item names an item on a private tracker only as tracked internally, with no title or URL, wherever it would list or link it, and takes none of its text.
- **A failed create is checked before any retry.** Look for the item it may have left behind, as the reference's `Create` section says; when one is there, use it and do not retry.

## Trackers

A tracker's operations live in a capabilities reference named `project-tracker.capabilities.<tracker>`. This skill owns the workflow; the reference owns the commands. Resolve a tracker for a level and a category: the initiative at level initiative, each shell at level epic with its own category, and a Promote source at level epic with its category. Know the category first: a routing chooses by it. A source item given by URL is on the tracker whose `Url` section parses it; when that is not the tracker its route names, say so and stop.

1. Look for a routing: `reference show project-tracker.routing`. When it finds none, go to step 3. When the command cannot run, read `.agents/references/project-tracker.routing.md` directly: absent means no routing (go to step 3); present means its pins cannot be resolved, so name the first matching pin, say the `reference` command cannot run, suggest `project-tracker` check once it can, and stop.
2. With a routing, take the first `Routes` row that matches the level and the category. No row matches: name the pair, suggest `project-tracker` change, and stop. Run `reference show <pin> --format json` on its pin. It finds nothing, or says the bare name is held by more than one plugin: name the pin and the problem, suggest `project-tracker` check, and stop. Otherwise load that reference and go to step 6.
3. Read the host of `git remote get-url origin`.
4. List what is installed: `reference search project-tracker.capabilities`. Keep only hits whose `match` is `prefix`, which may carry a `<plugin>/` qualifier; drop fuzzier ones such as `project-tracker.contract`.
5. Load the one whose `Detect` section matches the repository. Two matches, or a name ambiguous between plugins: report both qualified names, ask which, and load neither until answered. When the command cannot run, or nothing is left, load the bundled reference for the host from this skill's `references/` folder: `project-tracker.capabilities.github` for `github.com`, `project-tracker.capabilities.gitlab` for `gitlab.com` or a host `glab auth status --hostname <host>` accepts. Otherwise say that no tracker is set up for this repository, suggest `project-tracker`, and stop.
6. Read `contract:` in the reference's frontmatter. Missing, or not a version `project-tracker.contract` declares: name the tracker and the version, and stop.
7. Run its `Detect` checks; when a tool is missing, old, or logged out, say what to install, upgrade, or run, and stop.
8. Check that the tracker holds the level (`Levels held` in its `Tracker` section). When it does not, say so and stop; do not file the initiative as an epic or a plain issue.

Where the reference marks an operation `**Unsupported.**`: with no `Search`, the user confirms there is no duplicate; with no native `Link`, put the link in the body of the child, naming the parent. A shell on another tracker than the initiative cannot be a native child either: link it in its body and list it in the initiative's `Epics` section by title, or as tracked internally when the initiative is public and the shell's tracker private.

Promote never closes the epic, whatever the tracker. Where the `Retype` row for epic → initiative is silent, or a team's override makes it in place, use the default for this change: create the initiative and attach the epic as its child. An in-place change would turn the epic's issues into the initiative's epics; say so, and use the default. A row marked `**Unsupported.**` means the tracker cannot nest an epic under an initiative: say so and stop.

## Create

1. **Goal first.** Ask for the goal: one sentence on what changes, for whom. Ask for the category (feature or task; a bug is rarely an initiative) when it is not clear. Do not name an epic before the goal and its metric are settled.
2. **Metric.** Ask for one measure with its baseline (today's value, and the date it was read), its target, and its source (where anyone reads it). Then the time horizon (a quarter or a date, and the review dates) and the owners (one accountable person, and the contributing teams).
   - No measure, or no target: there is no initiative. Suggest an epic with the goal as its outcome (the `epic` skill when it is installed), and stop unless the user gives a measure and a target.
   - No baseline: write `unmeasured` and plan a first shell, `Measure the baseline for <measure>`, ordered before the others.
   - Two or more measures: ask which one is the initiative's. Suggest one initiative per measure for the others (the initiative level's `Too big`).
3. **Level check.** Read the initiative level's `Too small` in `repobuddy.work-levels`. When the epics named so far are one outcome, suggest an epic. Only suggest; continue at this level when the user does not change it.
4. **Name the epics as shells.** Ask for the epics that move the metric, each with a title, a category, an owner, and a one-line outcome. Order them by the owner's priority, the baseline shell first. Do not break any of them down.
5. **Aim check.** Ask: when every shell is done, does the metric reach its target? When the answer is no or not sure, say the epics are not aimed at the goal, and ask for the missing epic or a smaller target. Continue on the user's word.
6. **Trackers.** Resolve the initiative's tracker, and each shell's.
7. **Search for duplicates.** Run the initiative tracker's `Search` at least twice for the initiative (the full title, then the core noun and verb of the goal), and once for each shell on that shell's tracker. Show each hit (title, state, URL, level). A hit the user says is the initiative: say it exists, give its URL, and stop; this skill does not edit one. A hit the user says is a shell: when it is an epic, attach it instead of creating it, and its children stay as they are; when it is an issue, say it becomes an epic through `epic` Promote, and ask whether to file the shell anyway or stop.
8. **Confirm.** Run each tracker's `Kinds`, and the level-label check its `Retype` Limits give, when it gives one. Show the initiative (title, category, goal, the metric table, time horizon, owners, done-when, tracker, and the level label or field it uses), each shell in order (title, category, owner, outcome, tracker, created or attached), and, on its own line, any level label that is missing and will be created. Ask once for the whole plan. Do not create anything without it; a missing label is created, with the reference's command, only on a yes to that line.
9. **Create the initiative.** Run its tracker's `Create` at level initiative, with the body written to a file from `repobuddy.work-template.initiative`. Under `Epics`, list the shells in order as `- [ ] <title>, <owner>, <outcome> (shell)`, as the Guards allow; the tracker's native link carries their numbers.
10. **Create the shells.** Create each shell, in order, with its tracker's `Create` at level epic and the initiative as parent, the body written to a file from `repobuddy.work-template.epic`: the one-line outcome under `Outcome`, `None` under `Scope` and `Non-goals`, and under `Child Issues` the line `Broken down with the epic skill when the work starts.` Do not run `epic` for them. Attach each existing match with the `Link` section. After a failed create, follow the Guards before the next shell.
11. **Read back.** Read the initiative's tree with the `Link` section and compare the count with the plan. Report any shell that is missing.
12. **Report.** The initiative's URL, then each shell's URL in order, marking the baseline shell and attached items, and anything not filed with why. Say the next step: break each shell down with `epic` when its work starts.

## Promote (epic → initiative)

1. **Read the epic.** Parse its URL or number with the source tracker's `Url`, and read its title, body, state, category, level, and children (the `Link` section's tree). When its level is issue, say so and suggest promoting it to an epic with `epic` first, then stop. When it is already an initiative, say so and stop. When it is closed, ask before going on.
2. **Level check.** Read the epic level's `Too big` in `repobuddy.work-levels`. When the epic meets none of it, say so and ask whether to go on.
3. **Plan.** Run Create steps 1, 2, 4, and 5, starting from the epic's text. Its outcome is where the goal starts, not the goal: ask for the goal in the initiative's own words. Its category carries over when it is a feature or a bug; otherwise ask. The epic is the first shell, as it is (its title, owner, and outcome, read from its body); ask for the other shells.
4. **Where the initiative lives.** Resolve the tracker for level initiative and the epic's category, and read its `Retype` row for epic → initiative. Another tracker than the epic's: the initiative is created there and links the epic in its body; nothing moves. When the epic is on a private tracker and the initiative on a public one, the initiative takes none of the epic's text and names it only as tracked internally; say so now, before any search.
5. **Search for duplicates** for the initiative and each new shell, as in Create step 7.
6. **Confirm.** Show the row's steps (or the default from Trackers), the initiative's body, the epic with its URL and its count of children, unchanged, and each new shell. Wait for a yes.
7. **Create and attach.** Create the initiative as in Create step 9, with the epic first under `Epics`. Attach the epic as the row says, or with the `Link` section; on another tracker, through the link in the body. Do not edit the epic's body, label, or children.
8. **Create the other shells**, read back, and report, as Create steps 10 to 12. The report says the epic kept its URL and its children.

## What NOT to Do

- Do not write before the confirmation, or touch an epic the confirmation did not list
- Do not file an initiative without a measure and a target, or guess a baseline
- Do not name an epic before the goal and metric are settled
- Do not break a shell into issues, or change a promoted epic's body or children
- Do not close an epic, or file a duplicate of one that already exists
- Do not invent labels, types, or fields: use only those the tracker has, and create a level label only on a yes
- Do not put anything from a private tracker into a public one
- Do not turn an initiative into an epic here

## Validate

- [ ] The description in the frontmatter is at most 120 characters, and `name` equals the directory name
- [ ] Every copy in this skill's `references/` equals the file of the same name in `packages/buddy/references/` (`node scripts/sync-skill-references.mjs --check`)
- [ ] The request was checked for a security vulnerability before any mode ran
- [ ] The level checks, the contract, and both templates were loaded, and each capabilities reference's `contract:` was checked
- [ ] With a routing, every tracker came from a route, and a missing or ambiguous pin or an unmatched route stopped the skill before any search
- [ ] The goal and the metric (measure, baseline or `unmeasured`, target) were settled before any epic was named, and no number was guessed
- [ ] No shell was broken down, and a promoted epic kept its URL, body, and children
- [ ] No write ran without the user's confirmation, and the confirmation listed every epic the change touched
- [ ] A public item names a private one only as tracked internally
- [ ] The URL of the initiative and of each shell was returned
