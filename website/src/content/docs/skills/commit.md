---
title: commit
description: Commit one finished unit of work at a time, with no interactive git, by the repository's message rules.
---

`commit` stages and commits one unit of work at a time, safely enough for an agent to run unattended. Every git command
it runs works without an editor, a pager, or a prompt, so an agent never falls back to `git add .`.

## When to use

- "commit this"
- "split these changes into commits"
- "write a commit message for what is staged": it writes and shows the message, and commits only when asked
- A unit of work is finished and the repository's `AGENTS.md` says to commit it.

It is not for pushing, opening a pull request, or amending, squashing, or undoing a commit already made.

## Invoke

Run `/commit`, or ask in plain words. It takes no arguments.

## What it does

1. Checks the index first. Files staged earlier that are not this unit are unstaged; a file someone staged only part of
   stops the skill instead.
2. Holds a definition of done before staging: the build, tests, lint, a runtime surface exercised once, and docs.
3. Stages the unit by name with `git add <files>`, or part of a file with a patch of hunks and `git apply --cached`.
   Needing an "and" to describe the staged change means it is two commits.
4. Verifies the staged snapshot, with the unstaged part set aside, when unstaged changes could hide a failure.
5. Writes the message by the `commit.message` reference and commits with `git commit -F`, keeping trailers such as
   `Co-Authored-By`.
6. When a `pre-commit` or `commit-msg` hook rejects the commit, fixes the cause and commits again.

## Customize

The **Commit Discipline** section of `AGENTS.md` or `CLAUDE.md`, and a `SKILL.local.md` beside the skill, take
precedence over its defaults. Two references, loaded with the `reference` skill from the `cyber-agentkit` plugin, can be
overridden one section at a time in `.agents/references/<name>.md`:

| Reference | Default |
| --- | --- |
| `commit.message` | Conventional Commits, with the types, scopes, subject case, and header length read from the repository's commitlint config |
| `commit.release-notes` | When the repository has `.changeset/config.json`, a change to a published package is committed with its changeset; otherwise nothing |

The skill does not write changesets. It hands that to the `changesets` skill from
[repobuddy/buddy-changesets](https://github.com/repobuddy/buddy-changesets).

## Never does

It never runs `git add .`, `git add -A`, `git add -p`, `--no-verify`, or `--amend` to get past a hook, and it never
pushes, forces, or rewrites history.

More detail: [skill README](https://github.com/repobuddy/repobuddy/tree/main/packages/buddy/skills/commit).
