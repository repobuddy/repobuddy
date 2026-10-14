---
title: initiative
description: Set an initiative's goal and metric and file its epics as shells, or promote an epic by creating the initiative above it.
---

`initiative` sets up an initiative: a goal, one metric with a baseline and a target, and the epics that move it, filed as shells. A shell epic has a title, an owner, and a one-line outcome; you break it down later with [`epic`](/repobuddy/skills/epic/). It files on the tracker your [`project-tracker`](/repobuddy/skills/project-tracker/) routing names for initiatives, or on the `origin` remote's tracker without one.

## When to use

- "plan an initiative to halve our CI time this quarter"
- "set a goal and a metric for onboarding, and the epics behind it"
- "this epic is really a goal with a number, make it an initiative"
- "promote #801 to an initiative"

## Invoke

Run `/initiative`, or ask in plain words. It has two modes: create and promote.

## What it does

1. **Create** asks for the goal, then the metric: the measure, today's value and when it was read, the target, and where it is read. Then the time horizon, the owners, and the epics as shells in your priority order. It asks whether finishing every epic reaches the target, searches for duplicates, and files the initiative and each shell after you confirm the whole plan.
2. **Promote** creates the initiative as a new parent above an epic. The epic becomes its first shell and keeps its URL, body, and child issues.

Without a measure and a target there is no initiative: the skill suggests an epic instead. An unknown baseline is written `unmeasured`, and measuring it becomes the first shell. On GitHub an initiative is an issue labelled `initiative` with its epics as sub-issues; GitLab holds one on Ultimate only, and the Asana capabilities hold none. Each tracker's `project-tracker.capabilities.<tracker>` reference says how, and your team can override it in `.agents/references/`.

## Asks before acting

It writes nothing before you confirm, and creates a missing `initiative` label only on a yes. It never closes an epic or breaks one down, and never puts anything from a private tracker into a public one. It records the metric; it does not measure it or report progress. Turning an initiative back into an epic belongs to `epic`.
