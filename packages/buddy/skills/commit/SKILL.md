---
name: commit
description: "Commit changes, split them into commits, or write a commit message. Run it for each new git commit instead of plain git."
---

# Commit

Use when asked to commit, to split changes into commits, or to write a commit message, and when a unit
of work is finished and the repository's rules say to commit it. Not for pushing, opening a pull request,
or amending, rewording, squashing, or undoing a commit already made; those belong to other skills even
when the working tree has uncommitted changes.

Repository rules take precedence over this skill: the **Commit Discipline** section of `AGENTS.md` or
`CLAUDE.md`, and a `SKILL.local.md` beside this skill.

## References

Load these with the `reference` skill in the `cyber-agentkit` plugin, once per run, so every override
of them applies (repository, user, and plugin):

- `commit.message`: how to write the message. The default is Conventional Commits, with the types,
  scopes, subject case, and header length read from the repository's commitlint config.
- `commit.release-notes`: what a commit of a change to a published package carries. The default is its
  changeset, when the repository has `.changeset/config.json`, and nothing otherwise.

When the `reference` command cannot run, read the bundled default in this skill's folder,
`references/commit.message.default.md` or `references/commit.release-notes.default.md`. Then read
`.agents/references/<name>.md` when it exists: each of its sections replaces the default's section of
the same heading, and a new section is added.

Read [references/splitting.md](references/splitting.md) only for a split inside one file or a staged
snapshot check.

When asked only for a message ("write a commit message for what I staged"), what is staged is the unit:
write the message for it by `commit.message`, show it, and commit only when asked to. Skip the plan.

## Rules

- **Unit of work:** one coherent, independently revertable change: one feature, one bugfix, one
  refactor in one domain, one config change. A change's tests go in its commit; a test-only change is
  its own unit. A TDD cycle alone is not a commit boundary.
- **Split axes:** formatting or whitespace apart from logic; a refactor apart from the feature or fix
  that follows it; a dependency bump (manifest and lockfile) apart from a behavior change; unrelated
  areas apart. Where the axes do not settle it, the one-sentence test does: if the description of a
  unit needs an "and", it is two units.
- **Stage by name:** `git add <files>`, or a patch of hunks. Never `git add .`, `git add -A`,
  `git add -p`, `git restore -p`, `git commit -v`, or any command that opens an editor or a pager. Read
  diffs with `git --no-pager diff`.
- **Never commit with red checks.** Never `--no-verify`. When a test, type-check, or build fails, stage
  nothing and report the failure: do not change the unit's code to make it pass unless the request
  asked for that change. Lint and format errors in the unit are fixed, not reported.
- **Never rewrite history:** never push, force-push, rebase, or amend.
- **Decide, do not ask:** settle each choice, including how many commits, from these rules, the
  repository's rules, and the references. Ask only when they cannot decide, such as one changed line
  two units both need: do not rewrite it to fit one of them. With no one to answer, commit the units it
  does not touch, and report the line and the two units left uncommitted.

## Definition of done

Before staging a unit, its change is finished:

- Its checks pass. Run the smallest check that reads the unit's files: the affected package's tests,
  type-check or build, and lint and format on the changed files. Run the repository's full validation
  command once, before the last commit of the run, when the change is broad. Do not rerun a check that
  passed in this session on content that has not changed since; say which one you reused.
- A changed runtime surface (UI, endpoint, CLI, config) has been exercised once. Passing tests are not
  proof it works.
- Docs are updated, and the change carries what `commit.release-notes` says.

## Workflow

1. **Check the index:** `git --no-pager diff --cached --stat`. Unstage files that are not this run's
   work with `git restore --staged <files>`; their changes stay in the working tree. When such a file
   also has unstaged changes, someone chose part of it: do not unstage it, commit nothing, and report it.
2. **Plan:** `git status --porcelain` and `git --no-pager diff --stat`. Assign each file to a unit by
   the split axes. Read the full diff only of a file whose unit the path and the stat do not settle, or
   that holds two units. Never diff the whole tree when the stat lists more than a few files. State the
   plan, each commit and its files, before the first `git add`.
3. **Find the hooks**, once: `.husky/`, `.pre-commit-config.yaml`, `lefthook.yml`, or
   `git config core.hooksPath`. Say what runs on `pre-commit` and `commit-msg`, and run those checks
   with the unit's checks.
4. For each unit in the plan:
   1. **Check done:** the [Definition of done](#definition-of-done).
   2. **Stage it:** `git add <files>`, or a patch for part of a file (see `references/splitting.md`).
   3. **Read what is staged:** `git --no-pager diff --cached`. A secret or token stops the run: commit
      nothing and report the file and line. Take out of the unit any debug logging or formatting churn
      it did not ask for. Describe the unit in one sentence; when it needs an "and", unstage and split.
   4. **Verify the staged snapshot** when unstaged changes could change a check's result (see
      `references/splitting.md`). Skip it when nothing else is unstaged or the checks do not read those
      files, and say why.
   5. **Commit:** write the message by `commit.message` to a file outside the repository, with the body
      saying why and the trailers the harness or repository supplies, and run `git commit -F <file>`.
      When a hook rejects it, the commit did not happen: fix the cause (the message, or the code and its
      checks), stage what the fix touched, and commit again. Never `--amend`.
5. **Report:** each commit's short hash and subject with what changed and why in one line, the checks
   run or reused, and each file left uncommitted with the reason.

## Done when

Before reporting done, check each of these against the result, once, after the last commit. Report any
that fails.

- **C1.** `git show --stat` of each new commit lists only its unit's files, its change is described in
  one sentence with no "and", and a change's tests are in the change's commit.
- **C2.** Every change the run did not commit, and every file unstaged in step 1, still shows in
  `git status --porcelain`.
- **C3.** Each message passes `node_modules/.bin/commitlint` when it is installed, otherwise follows
  `commit.message`, and ends with the trailers the harness or repository supplies.
- **C4.** When `commit.release-notes` asks for a changeset, the commit of that change lists the
  `.changeset/<name>.md` file.
- **C5.** No commit was made while a check of its unit failed, and no commit adds a secret or token.
- **C6.** `git reflog` since the run started shows a `commit:` entry for each new commit and no
  `commit (amend)`, `rebase`, or `reset` that moves HEAD to another commit; `git rev-parse @{upstream}`
  is unchanged; `git stash list` holds no entry the run pushed.
- **C7.** The reply lists each commit's short hash, subject, and what and why, the checks run, and each
  file left uncommitted with the reason.
