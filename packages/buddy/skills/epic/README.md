# epic

Plans an epic, judges the plan against named criteria before anything is filed, and files it with its child issues on your tracker. It also changes an epic that exists, reviews one, and checks that one is ready to hand to an agent fleet. It turns an issue that grew into an epic, and an initiative with no metric back into one. When your routing keeps epics on another tracker (a private Asana for planning, say), it moves the work there and links it back.

## When to use

- "break this project into an epic with child issues"
- "this issue is bigger than we thought, make it an epic"
- "promote #42 to an epic"
- "split child #88 in two and keep the epic's child list in sync"
- "review epic #40: is the plan any good?"
- "is epic #79 ready to hand off? write its run order"
- "break down the shell epic #60 from our initiative"
- "demote this initiative to an epic, we dropped the metric"

## What it does

- **Create** asks for the outcome and how you will know it is done before it names any child. It then settles the plan one section at a time (key terms, research, scope and non-goals, open questions, children, blockers, executors and irreversible steps, done-when), judges each section against the planning criteria, and fixes what fails before it shows you anything. An unknown becomes a spike child, and an undecided design becomes a separate design issue. It searches for duplicates, files the epic and its children after you confirm the whole plan, links the blockers, and syncs the epic's child list.
- **Revise** changes an epic that exists: re-scope it, add, split, merge, or supersede a child, move a child to another repository, or fix its blockers. It shows every write in order and waits for a yes, then keeps the body's child list in step with the native sub-issues.
- **Review** judges an epic, filed or drafted, against the planning criteria EP1 to EP14. It reports each failure by ID, with the line and the fix, or fixes the plan and judges again.
- **Handoff** checks that an epic can run unattended: every child names who does it, every step an agent cannot do is a person's, every irreversible step waits for a confirmation, and every blocker is needed. It writes the run order (wave, child, executor, blocked by) into the body.
- **Promote** keeps the issue in place as the epic where the tracker allows (on GitHub it adds the `epic` label; on Asana the task gains subtasks; on GitLab Free it adds the `epic` label, and on Premium it promotes the issue to a new group epic), and moves its acceptance criteria into a first child.
- **Demote** shows the initiative's metric and warns that an epic drops it, then asks about each child epic: keep it attached or detach it.
- **Moves.** When the routing from [`project-tracker`](../project-tracker/README.md) puts epics on another tracker, it creates the epic there, links the two, and closes the source as moved or keeps it open as a mirror, as the routing says.

The planning criteria (`project-tracker.criteria.epic`), what a person and an agent can do (`project-tracker.executors`), and how research runs (`research.method`, which uses `research-workbench`'s `deep-research` by default) are references your team can override. How a level change happens on each tracker (in place or a new item, what the children do, the limits) comes from the tracker's `project-tracker.capabilities.<tracker>` reference, which your team can override.

## Safety

- It writes nothing before you confirm, and the confirmation lists every child the change touches.
- It never closes a child as a duplicate, and never drops one without saying where it went.
- It never moves anything from a private tracker into a public one; a public item says only that the work is tracked internally.
- It never files a security vulnerability publicly; it points to the private channel.

## Requirements

The tracker's CLI: `gh` 2.98.0 or later for GitHub, logged in; `glab` for GitLab, logged in (GitLab's calls are not yet tested on a real instance); the `cyber-asana` plugin for Asana. [`issue`](../issue/README.md) is used to file the children when it is installed. The research step uses `research-workbench` when it is installed, and web search otherwise. On GitHub, `scripts/epic-plan.mjs` reads the blocked-by graph, batches blocker changes, syncs the child list, and checks a filed epic.

## How to invoke

Ask for it directly, or run `/epic` where slash commands are supported.

## Install

```sh
npx skills add repobuddy/repobuddy --skill epic
```
