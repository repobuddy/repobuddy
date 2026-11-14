---
title: repo
description: Offer the vetted sections a repository's AGENTS.md is missing, such as auto-commit, and write only what you approve.
---

`repo` sets up how agents work in a repository. Its `enhance` subcommand checks the repository's instructions for each
vetted section, offers what is missing or stale one at a time, and writes only what you approve.

Rules about how one agent works in any repository, such as delegation, belong to
[buddy-agent-harness](https://github.com/repobuddy/buddy-agent-harness). `repo` covers the rules every agent working in
one repository follows.

## When to use

- "set up auto-commit", "make agents commit each unit of work"
- "what is this repo's AGENTS.md missing"
- "refresh the Commit Discipline section", after cyberplace's `init-commit-discipline` wrote it

## Invoke

```
/repo enhance [--root <dir>]
/repo help
```

A bare `/repo` shows the help.

## Sections

| Section | What it tells agents | Recommended home |
| --- | --- | --- |
| Commit Discipline | Commit each finished unit of work without waiting to be asked, with the [`commit`](/repobuddy/skills/commit/) skill | the repository's `AGENTS.md` |

## What `enhance` does

1. Reads the root `AGENTS.md` and any harness file that still holds instructions of its own, and judges them together
   by meaning. A repository that says "commit only when asked" is covered.
2. Checks your global instructions. If they already carry the text, it offers nothing.
3. Asks where a present section came from, with `prose-update` from `cyber-agentkit`: current, from a retired wording
   (it offers the current text as a replacement, naming any paragraphs of yours the replacement would remove), or
   yours (it leaves it alone). A section cyberplace's `init-commit-discipline` wrote is a retired wording.
4. Offers the text verbatim, with where it should go:

   | Destination | Reaches |
   | --- | --- |
   | the repository's `AGENTS.md` | everyone who clones it, and any agent CI runs |
   | your global `~/.agents/AGENTS.md` | every repository you open, and only you |

   For the global file it hands the text over instead of writing it, and says whether your harness loads that file.
5. Writes only what you approve, into the root `AGENTS.md`, and reports what it found either way.

## Never does

It never writes a nested `AGENTS.md`, a harness file, or a file outside the repository, and it never edits a section's
wording to fit the repository.

More detail: [skill README](https://github.com/repobuddy/repobuddy/tree/main/packages/buddy/skills/repo).
