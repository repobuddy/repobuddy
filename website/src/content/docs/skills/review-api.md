---
title: review-api
description: Review a library's public API for consistency and completeness against its own conventions, read-only.
---

`review-api` finds the exported surface, infers the canonical shape from a few exemplar units, and runs three read-only
audits: shape conformance, sibling completeness, and docs versus exports.

## When to use

- "review this project for consistency and API completeness"
- "what is missing from the API?"
- "are the docs in sync with the exports?"
- Before a major release, when the surface is about to be frozen.

## Invoke

Run `/review-api`, or ask in plain words. It takes no arguments.

## What it produces

A priority-ordered report: obvious fixes, design-level drift, sibling-justified gaps, docs issues, and a suggested order
of work. It checks every claim against the code before reporting it. The audits run on cheap subagents where the
harness supports them.

## What it will not do

Propose an API that no existing sibling justifies, report a documented intentional exception as drift, or edit code or
file issues on its own. When the report is done it offers to open one issue per section or start the obvious fixes.

## Requirements

Read access to the code. Filing issues afterward needs the host CLI.

## Example

```
/review-api are the docs in sync with the exports?
```

More detail: [skill README](https://github.com/repobuddy/repobuddy/tree/main/packages/buddy/skills/review-api).
