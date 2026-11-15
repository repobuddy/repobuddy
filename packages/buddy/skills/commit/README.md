# commit

Plans how a working tree splits into commits, then stages and commits one unit of work at a time, safely enough for an
agent to run unattended. It hands back the commits and a report of each one, the checks it ran, and what it left
uncommitted. It never pushes, amends, or opens an editor, a pager, or a prompt.

## Research

Full research:
[.research/skill-commit/conclusion.md](https://github.com/repobuddy/repobuddy/blob/main/.research/skill-commit/conclusion.md).
The job is real, and all four harnesses (Claude Code, Codex, Cursor, GitHub Copilot CLI) load Agent Skills and run
shell git. Codex's default sandbox keeps `.git` read-only. No published skill covers the whole Intent:

- [commit-work](https://github.com/softaworks/agent-toolkit) plans the split and uses few tokens, but stages with
  `git add -p`, asks questions, and checks after writing the message. This skill takes its planned split and lean run
  as its baseline.
- github/awesome-copilot `git-commit` avoids interactive git, but plans no split and runs no checks before
  committing.
- getsentry `commit`, caveman `caveman-commit`, and sentimony `commit-all` only write a message, or commit everything
  at once.

Recommendation: extend this skill, as the owner decided. The research changed nothing in the Intent. Two follow-ups
are held for the owner and not built: report a sandbox-blocked `git add` or `git commit` as left uncommitted (R1), and
detect a merge, cherry-pick, or unmerged index before step 1 (R2).

Where this skill and commit-work conflict:

| # | commit-work | This skill | Wins | Why |
| --- | --- | --- | --- | --- |
| D1 | `git add -p`, `git restore --staged -p`, `git commit -v` | stages by name or by a patch with `git apply --cached`; `git commit -F` | this skill | an agent cannot drive a prompt or an editor, and falls back to `git add .` |
| D2 | asks whether to make one or several commits, which style, and which rules | decides from the repository's rules and the references | this skill, with commit-work's default | it runs unattended; commit-work's own default is the answer it would get |
| D3 | puts tests in a commit apart from the code | a change's tests go in its commit; a test-only change is its own unit | this skill | each commit reverts on its own without breaking the tree |
| D4 | checks after staging | checks before committing, and never commits with a red check | this skill, run with commit-work's smallest check | a commit that fails its checks is not done; the scope keeps it cheap |
| D5 | Conventional Commits, fixed | the `commit.message` reference, Conventional Commits by default | this skill | a repository overrides the convention one section at a time |
| D6 | no index check, staged-snapshot check, hook recovery, or release notes | keeps each, run only when its condition holds | this skill | the owner asked to keep them; they cost nothing on the common path |

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

The message and release-note rules are references, loaded with the `reference` skill from
[cyber-agentkit](https://github.com/cyber-uni/cyber-agentkit). A repository overrides one section in
`.agents/references/<name>.md`:

- `commit.message`: Conventional Commits by default, with the rules of the repository's commit-message linter when it
  has one.
- `commit.release-notes`: by default, a change to a published package is committed with its changeset when the
  repository uses [changesets](https://github.com/changesets/changesets). The skill does not write changesets; the
  `changesets` skill from [repobuddy/buddy-changesets](https://github.com/repobuddy/buddy-changesets) does.

For example, to allow a `release` type:

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
