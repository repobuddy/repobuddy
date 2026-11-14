---
title: epic
description: Plan, revise, review, or hand off an epic and its child issues, or turn an issue or an initiative into an epic, on the tracker that holds epics.
---

`epic` plans an epic, judges the plan against named criteria, files it with its child issues, changes, reviews, and hands off an epic that exists, and moves work into the epic level: an issue that grew, or an initiative that lost its metric. It files on the tracker your [`project-tracker`](/repobuddy/skills/project-tracker/) routing names for epics, or on the `origin` remote's tracker without one.

## When to use

- "break this project into an epic with child issues"
- "this issue is bigger than we thought, make it an epic"
- "promote #42 to an epic"
- "split child #88 in two and keep the epic's child list in sync"
- "review epic #40: is the plan any good?"
- "is epic #79 ready to hand off? write its run order"
- "break down the shell epic #60 from our initiative"
- "demote this initiative to an epic, we dropped the metric"

## Invoke

Run `/epic`, or ask in plain words. It has six modes: create, revise, review, handoff, promote, and demote.

## What it does

1. **Create** asks for the outcome and how you will know it is done before it names any child. It settles the plan one section at a time: key terms, research, scope and non-goals, open questions, children, blockers, executors and irreversible steps, and done-when. It judges each section against the planning criteria and fixes what fails before it shows you the plan. An unknown becomes a `Spike:` child, and an undecided design becomes a separate design issue. It searches for duplicates of the epic and each child, files everything after you confirm the whole plan, links the blockers, and syncs the epic's child list. Children are filed through [`issue`](/repobuddy/skills/issue/) when it is installed.
2. **Revise** changes an epic that exists: re-scope it, add, split, merge, or supersede a child, move a child to another repository, or fix its blockers. It shows every write in order, waits for a yes, and keeps the body's child list in step with the native sub-issues.
3. **Review** judges an epic, filed or drafted, against the planning criteria EP1 to EP14, and reports each failure by ID with the line and the fix. It can also fix the plan and judge it again.
4. **Handoff** checks that an epic can run unattended. Every child must name who does it, every step an agent cannot do must be a person's, every irreversible step must wait for a confirmation, and every blocker must be needed. It writes the run order (wave, child, executor, blocked by) into the body.
5. **Promote** turns an issue into an epic in place where the tracker allows: on GitHub it adds the `epic` label and keeps the number; on Asana the task gains subtasks; on GitLab Free it adds the `epic` label, and on Premium it promotes the issue to a new group epic. The issue's acceptance criteria move into a first child.
6. **Demote** quotes the initiative's metric and warns that an epic drops it, then asks about each child epic: keep it attached or detach it.
7. **Moves.** When the routing keeps epics on another tracker, it creates the epic there, links the two, and closes the source as moved or keeps it open as a mirror, as the routing's `Moves` table says.

The planning criteria (`project-tracker.criteria.epic`), what a person and an agent can do on the tracker (`project-tracker.executors`), and how research runs (`research.method`, `research-workbench`'s `deep-research` by default) are references your team can override. On GitHub, the skill's `epic-plan.mjs` script reads the blocked-by graph, batches blocker changes, syncs the child list, and checks a filed epic.

How each tracker changes a level comes from the `Retype` section of its `project-tracker.capabilities.<tracker>` reference, which your team can override in `.agents/references/`.

## Asks before acting

It writes nothing before you confirm, and the confirmation lists every child the change touches. It never closes a child as a duplicate or drops one without saying where it went, and never moves anything from a private tracker into a public one: a public item says only that the work is tracked internally. Turning an epic into an issue or an initiative belongs to `issue` and `initiative`.
