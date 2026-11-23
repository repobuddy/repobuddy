#!/bin/sh
# The setup of case resume-next: it runs in each run's folder, a git repository with the case's files committed, before
# the model starts, with and without the skill. Make the state the case needs here, such as commits and uncommitted
# work; the prompt then holds only the request. It runs contained: it writes only to the run's folder and its empty
# HOME, and has no network. The run's .git/hooks and .git/config are read-only, so a write there fails with
# "Read-only file system" or "Device or resource busy". To install a git hook, commit it in a tracked folder and point
# git at it from the run's own HOME:
#   mkdir -p hooks && cp ... hooks/commit-msg && chmod +x hooks/commit-msg
#   git config --global core.hooksPath "$PWD/hooks"
# Set any other git config with --global too. A non-zero exit reports the run as not run, with this script's output.
# See the state it makes, with no model run: cyber-agentkit skill case try <skill folder> resume-next
set -e

# A checkpoint written at the start commit, then commits that met its whole goal: the guard and its test.
start=$(git rev-parse --short HEAD)
d="$(git rev-parse --path-format=absolute --git-common-dir)/repobuddy/checkpoints"
mkdir -p "$d"
cat > "$d/parse-null.md" <<MD
---
focus: parse() rejects null
repo: $(basename "$PWD")
branch: $(git branch --show-current)
commit: $start
created: 2026-11-20
updated: 2026-11-20
---

# parse() rejects null

## NEXT — resume here

Add a test to test/parse.test.js that parse(null) throws a TypeError, then run \`node --test\`.

## Goal

parse() throws a TypeError for null, with a test.

> make parse reject null

## Remaining steps

- Make parse(null) throw a TypeError in src/parse.js.

## Not in git

nothing
MD
cat > src/parse.js <<'JS'
export function parse(input) {
	if (input === null) throw new TypeError('null input')
	if (input === '') throw new TypeError('empty input')
	return JSON.parse(input)
}
JS
cat >> test/parse.test.js <<'JS'

test('parse(null) throws a TypeError', () => {
	assert.throws(() => parse(null), TypeError)
})
JS
git add src/parse.js test/parse.test.js
git commit -qm "fix: reject null in parse"
