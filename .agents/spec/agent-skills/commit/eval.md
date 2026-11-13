---
subject: packages/buddy/skills/commit/SKILL.md
eval:
  layers: [trigger, behavior]
  judge:
    model: claude-sonnet-5-5
    default_threshold: 4
  trigger:
    activation_threshold: 0.8
    runs: 3
---

# commit — measurement policy

The subject is `packages/buddy/skills/commit/SKILL.md` together with its `references/`: `splitting.md`
(the patch, `-U0`, `update-index`, and stash commands) and the bundled defaults
`commit.message.default.md` and `commit.release-notes.default.md`, which the judge follows when a
scenario says the `reference` command cannot run.

**Trigger and behavior carry signal; quality does not.** Trigger: the skill sits beside `changesets`
(buddy-changesets) and `merge-dep-prs`, and near push, pull request, squash, amend, and undo requests,
which share "commit". Behavior: what it stages, what it refuses to run, when it stops, and what a
commit carries are conduct. No scenario grades a gradient, so there is no `@rubric` and no `quality`
layer.

**`activation_threshold` is 0.8**, for the same reason as `issue`: the skill is chosen against near
neighbours that share its vocabulary.

## Known weaknesses

The suite was frozen after four cold spec-judge rounds (2026-11-12); the fourth returned ALIGNED. Its
advisory F3 was left open: `reads the allowed types, scope, and header length from the commitlint
config` pipes `git log -1` to commitlint although its When writes the message without asking for a
commit, so a judge may split on whether the commit had to happen.

A judged run reads a narrated transcript from a simulator that executes nothing. A transcript cannot
show that a command did not run or what the repository holds afterwards, so treat these passes as
unproven: `runs no git add ., git add -A, or git add -p` (splits a change across files), `runs no git
add -p and no git restore -p` (stages part of one file), `runs no bare git commit` (runs no command
that opens an editor), `runs no --no-verify and no --amend` (commits again after a commit-msg hook),
`the commit before is unchanged` (fixes the code when a pre-commit hook fails), `runs no git push`
(never pushes or rewrites history), `asks no question before committing` (decides the split), `does not
write the changeset itself` and `does not commit the change` (names the changesets skill),
`does not run the changesets skill` (carries no changeset outside a published package), `the commit adds no file under .changeset/` (adds no release notes), `the commit holds only the parser fix` and
`package.json's change is still in the working tree` (unstages files that are not this unit), `it does
not unstage README.md`, `it does not commit README.md along with the unit`, and `it makes no commit`
(stops when unstaging would lose a partial selection), `it stages nothing` (does not stage a change
that is not done), `without stashing` (skips the snapshot check), `it does not commit the staged change
while the snapshot check fails` (verifies the staged snapshot), `it makes no commit before the answer`
(asks the developer), `it does not unstage or restage src/config.ts` and `it makes no commit` (writes the message for what the developer staged), `it commits neither unit that needs the line` (stops and reports), and `it
commits the change with no .changeset/ file` (carries no changeset outside a published package, and for a private package).

`leaves the repository in the state its Validate section checks` asserts repository state (reflog,
upstream, stash list, `git show --stat`). It carries the proof for the negative assertions above only
under an execution harness that runs real git; under a judged run it is narrated like the rest.

`ships a skill file whose frontmatter and bundled reference copies are valid` and `does not defer to
another commit skill` are static checks of files, not simulated behavior.

The git mechanics (hunk patch with `git apply --cached`, the `-U0` split, `update-index --cacheinfo`,
the stash `--keep-index` round trip, `commitlint < file`) were exercised by hand in a scratch repository
when the skill was written (#900), not by an eval.
