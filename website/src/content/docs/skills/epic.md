---
title: epic
description: Plan an epic and its child issues, or turn an issue or an initiative into an epic, on the tracker that holds epics.
---

`epic` plans an epic, files it with its child issues, and moves work into the epic level: an issue that grew, or an initiative that lost its metric. It files on the tracker your [`project-tracker`](/repobuddy/skills/project-tracker/) routing names for epics, or on the `origin` remote's tracker without one.

## When to use

- "break this project into an epic with child issues"
- "this issue is bigger than we thought, make it an epic"
- "promote #42 to an epic"
- "demote this initiative to an epic, we dropped the metric"

## Invoke

Run `/epic`, or ask in plain words. It has three modes: create, promote, and demote.

## What it does

1. **Create** asks for the outcome and how you will know it is done before it names any child. It lists what is still unknown and makes each unknown a `Spike:` child, proposes children in your priority order, searches for duplicates of the epic and each child, and files everything after you confirm the whole plan. Children are filed through [`issue`](/repobuddy/skills/issue/) when it is installed.
2. **Promote** turns an issue into an epic in place where the tracker allows: on GitHub it adds the `epic` label and keeps the number; on Asana the task gains subtasks. The issue's acceptance criteria move into a first child.
3. **Demote** quotes the initiative's metric and warns that an epic drops it, then asks about each child epic: keep it attached or detach it.
4. **Moves.** When the routing keeps epics on another tracker, it creates the epic there, links the two, and closes the source as moved or keeps it open as a mirror, as the routing's `Moves` table says.

How each tracker changes a level comes from the `Retype` section of its `project-tracker.capabilities.<tracker>` reference, which your team can override in `.agents/references/`.

## Asks before acting

It writes nothing before you confirm, and the confirmation lists every child the change touches. It never closes a child as a duplicate or drops one without saying where it went, and never moves anything from a private tracker into a public one: a public item says only that the work is tracked internally. Turning an epic into an issue or an initiative belongs to `issue` and `initiative`.
