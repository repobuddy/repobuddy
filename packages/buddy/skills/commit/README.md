# commit

Stages and commits one unit of work at a time, safely enough for an agent to run unattended. It checks the change is
finished before staging, stages files by name, splits a mixed change into commits, writes the message by the
repository's rules, and runs no git command that opens an editor, a pager, or a prompt.

## When to use

- "commit this"
- "split these changes into commits"
- "write a commit message for what is staged"
- A unit of work is finished and the repository's `AGENTS.md` says to commit it.

## What it does

- Checks the index first and never commits files someone else staged along with this unit.
- Holds a definition of done before staging: build, tests, lint, a runtime surface exercised once, docs.
- Stages with `git add <files>`, or with a patch of hunks and `git apply --cached` for part of a file. Never
  `git add .`, `-A`, or `-p`.
- Verifies the staged snapshot, not the working tree, when unstaged changes could hide a failure.
- Writes the message with `git commit -F` or `-m`, keeping trailers such as `Co-Authored-By`.
- When a hook rejects the commit, fixes the cause and commits again. Never `--no-verify` or `--amend`.
- Never pushes or rewrites history.

## Customize

Rules in the **Commit Discipline** section of `AGENTS.md` or `CLAUDE.md`, or in a `SKILL.local.md` beside the skill,
take precedence over its defaults.

The message and release-note rules are references, loaded with the `reference` skill from
[cyber-agentkit](https://github.com/cyber-uni/cyber-agentkit). A repository overrides one section in
`.agents/references/<name>.md`:

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
