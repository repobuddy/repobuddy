---
title: code-review
description: Review a change set through three named engineering lenses and report where they disagree.
---

`code-review` resolves a change set against a base commit, then runs three independent passes: Linus (data structures,
special cases, cost of generality), Uncle Bob (responsibility, dependency direction, naming), and Fowler (smells,
change locality, reversibility). The lenses are stances, not quotations.

## When to use

- "review this branch" or "would Linus approve this?"
- "is this abstraction worth it?" or "review this PR for design, not bugs"

It is not a defect hunt. Run tests, the type checker, and linters first.

## Invoke

Run `/code-review`, or ask in plain words. It takes no arguments. The base is the commit, tag, or branch you name; on a
feature branch it is the merge base with the default branch; for uncommitted work it is `HEAD`.

## What it produces

A report that leads with findings all three lenses agree on, then names each disagreement as a tradeoff with the
condition that would resolve it. It changes no files.

## Requirements

`git` only.

## Example

```
/code-review review this branch against main for design
```

More detail: [skill README](https://github.com/repobuddy/repobuddy/tree/main/packages/buddy/skills/code-review).
