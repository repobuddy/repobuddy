---
name: commit
description: "Commits work: stages one unit by name, checks it is done, commits with no interactive git."
---

# Commit

Use when asked to commit, to split changes into commits, or to write a commit message, and when a unit
of work is finished and the repository's rules say to commit it.

Repository rules take precedence over this skill: the **Commit Discipline** section of `AGENTS.md` or
`CLAUDE.md`, and a `SKILL.local.md` beside this skill.

## References

Load these with the `reference` skill in the `cyber-agentkit` plugin, so a repository's override in
`.agents/references/<name>.md` applies:

- `commit.message`: how to write the message. The default is Conventional Commits, with the types,
  scopes, subject case, and header length read from the repository's commitlint config.
- `commit.release-notes`: what a commit of a change to a published package carries. The default is its
  changeset, when the repository has `.changeset/config.json`, and nothing otherwise.

When the `reference` command cannot run, read the bundled default in this skill's folder,
`references/commit.message.default.md` or `references/commit.release-notes.default.md`. Then read
`.agents/references/<name>.md` when it exists: each of its sections replaces the default's section of
the same heading, and a new section is added.

When asked only for a message ("write a commit message for what I staged"), what is staged is the unit:
write the message for it by `commit.message`, show it, and commit only when asked to.

Read [references/splitting.md](references/splitting.md) before a split inside one file or a snapshot
check: it has the commands for building the patch, a hunk that mixes two units, and restoring the stash
when other sessions share it.

## Rules

- **Unit of work:** one coherent, independently revertable change: one feature, one bugfix, one
  refactor in one domain, one config change. Never two unrelated concerns in one commit. A TDD cycle
  alone is not a commit boundary.
- **One sentence:** describe the staged change in one sentence. If it needs an "and", it is two commits.
- **Stage by name:** `git add <files>`, or a patch of hunks (see [Splitting](#splitting)). Never
  `git add .`, `git add -A`, `git add -p`, `git restore -p`, `git commit -v`, or any command that opens
  an editor or a pager. Read diffs with `git --no-pager diff`.
- **Never commit with red checks.** Never `--no-verify`.
- **Never rewrite history:** never push, force-push, rebase, or amend.
- **Decide, do not ask:** settle each choice from these rules, the repository's rules, and the
  references. Ask only when they cannot decide, such as a change that fits two units. With no one to
  answer, stop and report what is left uncommitted and why.

## Definition of done

Do not stage until the change is finished:

- The type-check or build passes.
- Tests pass: the affected suite at least, the repository's full validation command when the change is
  broad.
- Lint and format are clean.
- Anything with a runtime surface (UI, endpoint, CLI, config) has been exercised once. Passing tests are
  not proof it works.
- Docs are updated, and the change carries what `commit.release-notes` says.

## Hooks

Look for `.husky/`, `.pre-commit-config.yaml`, `lefthook.yml`, or `git config core.hooksPath`, and say
what will run on `pre-commit` and `commit-msg`. Run those checks yourself before committing.

When a hook rejects the commit, the commit did not happen. Read its output, fix the cause (the message,
or the code and then the checks above), stage what the fix touched, and run `git commit` again. Never
`--no-verify`, and never `--amend`: that changes the commit before, which is another unit.

## Workflow

1. **Check the index:** `git --no-pager diff --cached --stat`. When it holds changes that are not this
   unit, unstage those files with `git restore --staged <files>`; their changes stay in the working
   tree. Stop and report instead when such a file also has unstaged changes (it shows in
   `git --no-pager diff` too): someone chose part of it, and unstaging would lose that choice. Never
   commit them along.
2. **Inspect:** `git status --porcelain`, `git --no-pager diff`.
3. **Check done:** the [Definition of done](#definition-of-done).
4. **Stage this unit only:** `git add <files>`, or a patch for part of a file (see [Splitting](#splitting)).
5. **Read what is staged:** `git --no-pager diff --cached`, and apply the one-sentence test. When it
   fails, unstage and split.
6. **Verify the staged snapshot** when unstaged changes could change the result; see
   [Splitting](#splitting).
7. **Write the message** by `commit.message`, to a file outside the repository, with the trailers the
   harness or repository supplies. Commit with `git commit -F <file>`. Use one `-m` per paragraph
   only when no file can be written.
8. **Confirm:** `git log -1 --stat` shows the new commit, and `git status --porcelain` shows only what
   the next units hold. Repeat from step 1 for the next unit.

## Splitting

Split by file with `git add <files>`. To commit part of one file, write a patch of only this unit's
hunks and stage it with `git apply --cached <patch>`, then check it with `git --no-pager diff --cached`.

Tests run on the working tree, so unstaged changes can make a broken commit pass. Before committing,
set aside only the unstaged part (`git stash push --keep-index --include-untracked -m <tag>`), run the
checks, and restore it (`git stash pop`). Skip this when nothing is unstaged, or when the unstaged
changes are in files the checks do not read, and say why you skipped it.

## Validate

After each commit:

- [ ] `git show --stat HEAD` lists only this unit's files, and its change is described in one sentence with no "and"
- [ ] The files unstaged in step 1 still show their changes in `git status --porcelain`
- [ ] `git log -1 --format=%B | node_modules/.bin/commitlint` exits 0 when commitlint is installed; otherwise the message follows `commit.message`
- [ ] When `commit.release-notes` asks for a changeset, `git show --stat HEAD` lists the `.changeset/<name>.md` file
- [ ] `git reflog` since the skill started shows a `commit:` entry for each new commit and no `commit (amend)`, `rebase`, or `reset` that moves HEAD to another commit (the snapshot check's `reset: moving to HEAD` is expected)
- [ ] The upstream is unchanged: `git rev-parse @{upstream}` gives the same commit as before the skill ran
- [ ] `git stash list` holds no entry the skill pushed
