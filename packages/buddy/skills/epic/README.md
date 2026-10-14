# epic

Plans an epic and files it with its child issues on your tracker. It also turns an issue that grew into an epic, and an initiative with no metric back into one. When your routing keeps epics on another tracker (a private Asana for planning, say), it moves the work there and links it back.

## When to use

- "break this project into an epic with child issues"
- "this issue is bigger than we thought, make it an epic"
- "promote #42 to an epic"
- "break down the shell epic #60 from our initiative"
- "demote this initiative to an epic, we dropped the metric"

## What it does

- **Create** asks for the outcome and how you will know it is done before it names any child. It lists what is still unknown and makes each one a spike child, proposes child issues in your priority order, searches for duplicates, and files the epic and its children after you confirm the whole plan.
- **Promote** keeps the issue in place as the epic where the tracker allows (on GitHub it adds the `epic` label; on Asana the task gains subtasks; on GitLab Free it adds the `epic` label, and on Premium it promotes the issue to a new group epic), and moves its acceptance criteria into a first child.
- **Demote** shows the initiative's metric and warns that an epic drops it, then asks about each child epic: keep it attached or detach it.
- **Moves.** When the routing from [`project-tracker`](../project-tracker/README.md) puts epics on another tracker, it creates the epic there, links the two, and closes the source as moved or keeps it open as a mirror, as the routing says.

How a level change happens on each tracker (in place or a new item, what the children do, the limits) comes from the tracker's `project-tracker.capabilities.<tracker>` reference, which your team can override.

## Safety

- It writes nothing before you confirm, and the confirmation lists every child the change touches.
- It never closes a child as a duplicate, and never drops one without saying where it went.
- It never moves anything from a private tracker into a public one; a public item says only that the work is tracked internally.
- It never files a security vulnerability publicly; it points to the private channel.

## Requirements

The tracker's CLI: `gh` 2.98.0 or later for GitHub, logged in; `glab` for GitLab, logged in (GitLab's calls are not yet tested on a real instance); the `cyber-asana` plugin for Asana. [`issue`](../issue/README.md) is used to file the children when it is installed.

## How to invoke

Ask for it directly, or run `/epic` where slash commands are supported.

## Install

```sh
npx skills add repobuddy/repobuddy --skill epic
```
