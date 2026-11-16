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

It also amends the latest commit for a small fix, when that commit is unpushed. It is not for pushing, opening a pull request, squashing or undoing a commit already made, or rewriting a pushed one.

## Invoke

Run `/commit`, or ask in plain words. It takes no arguments.

## What it does

1. Stops first, commits nothing, and names the state when a merge, cherry-pick, revert, or rebase is in progress or a path
   is unmerged.
2. Checks the index. When a staged file that is not this run's work also has unstaged changes, it commits nothing
   and reports it.
3. Plans every commit from `git status` and `git diff --stat` before staging the first, and reads full diffs only where
   the split needs them.
4. Splits formatting from logic, a refactor from the change after it, and a dependency bump from a behavior change. A
   change's tests stay in its commit. Needing an "and" to describe a commit means it is two commits.
5. Holds a definition of done before staging: the smallest check that covers the unit, a runtime surface exercised once,
   and docs. It runs the full validation command once when the change is broad, and reuses a check already passed on the
   same content.
6. Finds the hooks with `git rev-parse --git-path hooks`. When a `pre-commit` or `commit-msg` hook exists, it runs those
   checks with the unit's.
7. Stages the unit by name with `git add <files>`, or part of a file with a patch of hunks and `git apply --cached`.
8. Reads the staged diff for a secret, debug logging, or formatting churn. A secret stops the run. When unstaged changes
   could hide a failure, it verifies the staged snapshot instead of the working tree.
9. Loads `commit.message` and `commit.release-notes` once per run, writes the message by the first, and commits with
   `git commit -F`, keeping trailers such as `Co-Authored-By`.
10. Amends the latest commit, instead of adding one, only when it is on no remote and the fix belongs to its unit. A
    commit a hook rejected never happened, so it is committed again, not amended.
11. When the harness's sandbox blocks `git add` or `git commit`, it stops and reports each change as "uncommitted:
    blocked by sandbox". It never changes the sandbox, git config, or hooks to get around the block.
12. Reports each commit's hash, subject, and what changed and why, the checks it ran or reused, and each file it left
    uncommitted.

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

It never runs `git add .`, `git add -A`, `git add -p`, or `--no-verify`, and it never pushes, forces, rebases, or
rewrites a pushed commit.

More detail: [skill README](https://github.com/repobuddy/repobuddy/tree/main/packages/buddy/skills/commit).
