# Splitting and verifying a commit

Every command here runs without an editor, a pager, or a prompt. Write patches and message files in a
temporary folder outside the repository, so they are never staged.

## Part of a file

1. Write the file's whole diff to a patch: `git --no-pager diff <file> > <tmp>/full.patch`.
2. Copy it to `<tmp>/unit.patch`, keeping the four header lines (`diff --git`, `index`, `---`, `+++`)
   and only the hunks for this unit. Keep each hunk whole, from its `@@` line to the line before the
   next `@@`. Dropping a whole hunk needs no other edit: each hunk names its lines in the original file.
3. Check, then stage it: `git apply --cached --check <tmp>/unit.patch`, then
   `git apply --cached <tmp>/unit.patch`.
4. Read the result: `git --no-pager diff --cached <file>` shows this unit, and `git --no-pager diff
   <file>` shows what is left for the next one.

When `--check` fails, the patch was edited inside a hunk. Build it again from step 1.

## A hunk that mixes two units

Changes within three lines of each other share a hunk. Build the patch with no context instead,
`git --no-pager diff -U0 <file>`, so each changed run of lines is its own hunk, and stage it with
`git apply --cached --unidiff-zero <patch>`. Check it first with
`git apply --cached --check --unidiff-zero <patch>`: without `--unidiff-zero`, the check rejects a
patch with no context.

When one changed run still holds both units, write the file as it must read in this commit to
`<tmp>/<name>` and stage that content directly:

```sh
mode=$(git ls-files -s -- <file> | cut -d' ' -f1)   # 100644 for a new file
git update-index --add --cacheinfo "$mode,$(git hash-object -w <tmp>/<name>),<file>"
```

The working tree keeps the full change for the next commit.

## The staged snapshot

Tests, the build, and lint read the working tree, not the index. Unstaged changes, and untracked files,
can make a commit pass that fails on its own.

1. Save the staged tree: run `git write-tree` and note the hash it prints, since a shell variable may
   not last until you need it. Then set aside everything not staged:
   `git stash push --keep-index --include-untracked -m <unique-tag>`. The working tree now matches the
   index.
2. Run the checks from the [Definition of done](../SKILL.md#definition-of-done).
3. Restore the set-aside changes: `git stash pop`. When other sessions share the stash stack, as git
   worktrees of one repository do, restore the entry you pushed and not the top one: find it with
   `git stash list --format='%gd %gs'`, run `git stash pop <stash@{n}>`.
4. When the checks failed, fix the staged change before committing.

Restore the stash before you do anything else, even when a check fails. A pop that reports a conflict,
as staged and unstaged changes on adjacent lines do, leaves the entry on the stack and the index in
conflict, so the staged selection is gone. Restore both from what you saved: for each conflicted file,
`git checkout <stash@{n}> -- <file>` (the working tree as it was), then `git read-tree <hash>` with the hash from step 1 (the
index as it was), then `git stash drop <stash@{n}>`. An untracked file the pop did not bring back is in
`<stash@{n}>^3`: `git checkout <stash@{n}>^3 -- <file>`, then `git restore --staged <file>`.

Skip the snapshot check when `git status --porcelain` shows nothing outside the index, or when every
unstaged change is in a file the checks you run do not read, and say why you skipped it.
