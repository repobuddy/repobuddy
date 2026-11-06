---
"repobuddy": minor
---

Add the `commit` skill. It stages and commits one unit of work at a time, safely enough for an agent to run unattended: it checks the index and a definition of done before staging, stages files by name or hunks with `git apply --cached`, verifies the staged snapshot when unstaged changes could hide a failure, and recovers from a hook rejection without `--no-verify` or `--amend`. No command it runs opens an editor, a pager, or a prompt. The message rules (`commit.message`, Conventional Commits read from the repository's commitlint config) and the release-note rules (`commit.release-notes`, the changeset when the repository uses changesets) are references a repository overrides in `.agents/references/`.
