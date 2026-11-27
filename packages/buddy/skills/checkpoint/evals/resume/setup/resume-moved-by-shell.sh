#!/bin/sh
# The setup of case resume-moved-by-shell, the same state as resume-outside-repo: the session starts in a folder that
# is not a git repo and holds one repo, app/, whose common git dir has the parse-null checkpoint. See the state it
# makes, with no model run:
# cyber-agentkit skill case try <skill folder> resume-moved-by-shell
set -e
# The run's .git/config and hooks are read-only, so break the repo instead: without HEAD, git no longer reads the
# folder as a repo.
rm -rf .git/HEAD .git/refs .git/objects
! git rev-parse --git-dir >/dev/null 2>&1
mkdir app
cd app
git init -q -b main
git config --global user.email test@example.com
git config --global user.name test
echo 'export const parse = (s) => JSON.parse(s)' > parse.js
git add parse.js
git commit -q -m init
d="$(git rev-parse --path-format=absolute --git-common-dir)/repobuddy/checkpoints"
mkdir -p "$d"
cat > "$d/parse-null.md" <<MD
---
focus: parse() rejects null
repo: app
branch: main
commit: $(git rev-parse --short HEAD)
created: 2026-11-20
updated: 2026-11-20
---

# parse() rejects null

## NEXT — resume here

Make parse(null) throw a TypeError in parse.js, then run \`node --test\`.

## Goal

parse() throws a TypeError for null.

## Not in git

nothing
MD
