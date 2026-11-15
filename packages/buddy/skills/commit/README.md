# commit

Plans how a working tree splits into commits, then stages and commits one unit of work at a time, safely enough for an
agent to run unattended. It hands back the commits and a report of each one, the checks it ran, and what it left
uncommitted. It never pushes, amends, or opens an editor, a pager, or a prompt.

## When to use

- "commit this"
- "split these changes into commits"
- "write a commit message for what is staged": it writes and shows the message, and commits only when asked
- A unit of work is finished and the repository's `AGENTS.md` says to commit it.

Not for pushing, opening a pull request, or amending, squashing, or undoing a commit already made.

## What it does

- Checks the index first and never commits files someone else staged along with this unit.
- Plans every commit from `git status` and `git diff --stat` before staging the first, reading full diffs only where
  the split needs them.
- Splits formatting from logic, a refactor from the change after it, and a dependency bump from a behavior change.
  A change's tests stay in its commit.
- Holds a definition of done before staging: the smallest check that covers the unit, a runtime surface exercised
  once, docs. The full validation command runs once, when the change is broad, and a check already passed on the same
  content is not run again.
- Stages with `git add <files>`, or with a patch of hunks and `git apply --cached` for part of a file. Never
  `git add .`, `-A`, or `-p`.
- Reads the staged diff for a secret, debug logging, or formatting churn before committing.
- Verifies the staged snapshot, not the working tree, when unstaged changes could hide a failure.
- Writes the message with `git commit -F`, keeping trailers such as `Co-Authored-By`.
- When a hook rejects the commit, fixes the cause and commits again. Never `--no-verify` or `--amend`.
- Reports each commit's hash, subject, and why.

## Customize

Rules in the **Commit Discipline** section of `AGENTS.md` or `CLAUDE.md`, or in a `SKILL.local.md` beside the skill,
take precedence over its defaults.

The message and release-note rules are references: the skill reads its bundled default, and a repository overrides
one section of it in `.agents/references/<name>.md`, in the format of the `reference` skill from
[cyber-agentkit](https://github.com/cyber-uni/cyber-agentkit):

- `commit.message`: Conventional Commits by default, with the types, scopes, subject case, and header length read from
  the repository's commitlint config.
- `commit.release-notes`: by default, a change to a published package is committed with its changeset when the
  repository uses [changesets](https://github.com/changesets/changesets). The skill does not write changesets; the
  `changesets` skill from [repobuddy/buddy-changesets](https://github.com/repobuddy/buddy-changesets) does.

For example, to allow a `release` type without commitlint:

```markdown
---
merge: patch
---

## Type

| Type | The change |
| --- | --- |
| `release` | a version bump |
| `feat` | adds behavior a user can see |
| `fix` | corrects behavior that was wrong |
| `chore` | anything else |
```

## Install

```sh
npx skills add repobuddy/repobuddy --skill commit
```
