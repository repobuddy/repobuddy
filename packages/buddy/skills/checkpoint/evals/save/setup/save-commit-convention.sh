#!/bin/sh
# The setup of case save-one-topic: it runs in each run's folder, a git repository with the case's files committed, before
# the model starts, with and without the skill. Make the state the case needs here, such as commits and uncommitted
# work; the prompt then holds only the request. It runs contained: it writes only to the run's folder and its empty
# HOME, and has no network. The run's .git/hooks and .git/config are read-only, so a write there fails with
# "Read-only file system" or "Device or resource busy". To install a git hook, commit it in a tracked folder and point
# git at it from the run's own HOME:
#   mkdir -p hooks && cp ... hooks/commit-msg && chmod +x hooks/commit-msg
#   git config --global core.hooksPath "$PWD/hooks"
# Set any other git config with --global too. A non-zero exit reports the run as not run, with this script's output.
# See the state it makes, with no model run: cyber-agentkit skill case try <skill folder> save-one-topic
set -e

# The half-done edit the prompt describes: a null guard, written but not tested or committed.
cat > src/parse.js <<'JS'
export function parse(input) {
	if (input === null) throw new TypeError('null input')
	if (input === '') throw new TypeError('empty input')
	return JSON.parse(input)
}
JS

# The repo's commit convention: a required scope, written down and followed by its history.
cat > CONTRIBUTING.md <<'MD'
# Contributing

Write every commit subject as `<type>(<scope>): <subject>`. The scope is required: name the area the commit
touches, such as `parse`, `readme` or `notes` (for notes and checkpoints). A subject without a scope is rejected in
review.
MD
git add CONTRIBUTING.md
git commit -qm "docs(contributing): require a scope in commit subjects"
