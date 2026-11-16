#!/bin/sh
# The setup of case mid-merge: it runs in each run's folder, a git repository with the case's files committed, before
# the model starts, with and without the skill. Make the state the case needs here, such as commits and uncommitted
# work; the prompt then holds only the request. It runs contained: it writes only to the run's folder and its empty
# HOME, and has no network. The run's .git/hooks and .git/config are read-only, so a write there fails with
# "Read-only file system" or "Device or resource busy". To install a git hook, commit it in a tracked folder and point
# git at it from the run's own HOME:
#   mkdir -p hooks && cp ... hooks/commit-msg && chmod +x hooks/commit-msg
#   git config --global core.hooksPath "$PWD/hooks"
# Set any other git config with --global too. A non-zero exit reports the run as not run, with this script's output.
# See the state it makes, with no model run: cyber-agentkit skill case try <skill folder> mid-merge
set -e
mkdir -p src
printf 'export const mode = "base"\n' > src/config.js
git add src/config.js
git commit -qm "chore: add config"
git rev-parse HEAD > .git/case-start
git checkout -qb topic
printf 'export const mode = "topic"\n' > src/config.js
git commit -qam "feat: topic mode"
git checkout -q -
printf 'export const mode = "main"\n' > src/config.js
git commit -qam "feat: main mode"
git rev-parse HEAD > .git/case-start
git merge topic >/dev/null 2>&1 || true
printf '# notes\n' > notes.txt
