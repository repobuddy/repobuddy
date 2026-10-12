---
description: The checks that define an issue, an epic, and an initiative, and when work is too big or too small for its level.
tags: [work-levels, issue, epic, initiative]
---

## Issue

### Is

One deliverable, one owner, shipped in one or a few PRs within an iteration.

### Done when

It ships.

### Too big

Suggest an epic when two or more of these hold (one is only a note):

- Two parts could ship on different days, each useful alone.
- The goal sentence has more than one "and", or lists three or more deliverables.
- More than one person or team would own a part.
- It would take more than one iteration or more than a few PRs.
- It names several surfaces or packages.
- "Done" is a state of the world ("users can X"), not "this change merged".
- The title is a verb of scale: overhaul, redesign, migrate, support X across, improve Y.

Offer the smaller version that ships first as an alternative.

### Too small

Suggest not tracking it separately when any of these holds:

- It is one obvious edit the requester can make now (a typo, a one-line fix).
- It is a step of an open issue with the same owner that ships in the same PR.
- Nobody will track its "done".

## Epic

### Is

Several independently shippable issues that together deliver one outcome.

### Done when

Its children are done.

### Too big

Suggest an initiative when any of these holds:

- It has a number, a metric, or a target ("reduce build time by half").
- It needs more than one team or more than one quarter.
- "Done" counts only when a measure moves, not when work ships.

### Too small

Suggest an issue when it has one child, its children cannot ship apart, or it has one owner and one PR.

## Initiative

### Is

Several epics aimed at a measurable goal, across teams or quarters.

### Done when

The goal's metric is met.

### Too big

There is no level above. Split it into initiatives with one metric each.

### Too small

Suggest an epic when it has no metric, or when its epics are one outcome.
