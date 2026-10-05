---
title: llms-txt
description: Publish a generated llms.txt from a project's public surface, with a CI drift check.
---

`llms-txt` decides whether a project needs an [`llms.txt`](https://llmstxt.org), then writes a generator that derives
the file from the project's public surface and wires a `--check` drift check into CI. The file is never hand-written.

## When to use

- "add an llms.txt" or "generate llms.txt"
- "our llms.txt is out of date"
- "make this package readable by agents"
- A public API changed and the file must follow.

`llms.txt` is for someone using the package or site. `AGENTS.md` is for someone changing the repo. A private repo or an
application with no public surface gets no file, and the skill says so.

## Invoke

Run `/llms-txt`, or ask in plain words. It takes no arguments.

## What it produces or changes

- A generator script in the package's existing scripts directory, with a write mode, a `--check` mode, and a gaps report.
- The `llms.txt` file, shipped in the package `files`, on the docs site at `/llms.txt`, or both (it says why).
- The `--check` call added to the command CI already runs, not a new job.
- An issue listing the documentation gap the generator exposes. It does not write the missing docs.

An existing hand-written file is replaced by the generator, and its prose is carried over only after you see the before
and after.

## Asks before acting

It shows the before and after for a hand-written file. It reads the CI workflows first, including reusable ones.

## Hands off to

Nothing. [`agent-readiness`](/repobuddy/skills/agent-readiness/) sends its `llms.txt` fixes to this skill.

## Requirements

Node.js, plus the project's own formatter and verify command. The gap issue goes to the repo's issue tracker.

## Example

```
/llms-txt
```

More detail: [skill README](https://github.com/repobuddy/repobuddy/tree/main/packages/buddy/skills/llms-txt).
