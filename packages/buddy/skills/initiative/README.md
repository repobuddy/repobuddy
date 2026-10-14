# initiative

Sets up an initiative on your tracker: a goal, one metric with a baseline and a target, and the epics that move it, filed as shells. A shell epic has a title, an owner, and a one-line outcome; you break it into issues later with [`epic`](../epic/README.md). It also promotes an epic to an initiative by creating the initiative above it.

## When to use

- "plan an initiative to halve our CI time this quarter"
- "set a goal and a metric for onboarding, and the epics behind it"
- "this epic is really a goal with a number, make it an initiative"
- "promote #801 to an initiative"

## What it does

- **Create** asks for the goal, then the metric: the measure, today's value, the target, and where it is read. It asks for the time horizon and the owners, then the epics as shells, in your priority order. It asks whether finishing every epic reaches the target. It searches for duplicates and files the initiative and its shells after you confirm the whole plan.
- **Promote** creates the initiative as a new parent and attaches the epic as its first shell. The epic keeps its URL, its body, and its child issues.

How each tracker holds an initiative and attaches an epic comes from the tracker's `project-tracker.capabilities.<tracker>` reference, which your team can override. On GitHub an initiative is an issue labelled `initiative` with its epics as sub-issues. GitLab holds an initiative on Ultimate only, and the Asana capabilities hold none, so the skill stops there.

## Safety

- No metric, no initiative: without a measure and a target it suggests an epic instead. It never guesses a number; an unknown baseline is written `unmeasured`, and measuring it becomes the first epic.
- It writes nothing before you confirm, and never closes or breaks down an epic.
- It never puts anything from a private tracker into a public one; a public item says only that the work is tracked internally.
- It never files a security vulnerability publicly; it points to the private channel.

It records the metric. It does not measure it or report progress.

## Requirements

The tracker's CLI: `gh` 2.98.0 or later for GitHub, logged in. Use [`epic`](../epic/README.md) to break each shell down.

## How to invoke

Ask for it directly, or run `/initiative` where slash commands are supported.

## Install

```sh
npx skills add repobuddy/repobuddy --skill initiative
```
