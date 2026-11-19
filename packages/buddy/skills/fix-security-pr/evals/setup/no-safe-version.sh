#!/bin/sh
# The setup of case no-safe-version: it runs in each run's folder, a git repository with the case's files committed, before
# the model starts, with and without the skill. Make the state the case needs here, such as commits and uncommitted
# work; the prompt then holds only the request. It runs contained: it writes only to the run's folder and its empty
# HOME, and has no network. The run's .git/hooks and .git/config are read-only, so a write there fails with
# "Read-only file system" or "Device or resource busy". To install a git hook, commit it in a tracked folder and point
# git at it from the run's own HOME:
#   mkdir -p hooks && cp ... hooks/commit-msg && chmod +x hooks/commit-msg
#   git config --global core.hooksPath "$PWD/hooks"
# Set any other git config with --global too. A non-zero exit reports the run as not run, with this script's output.
# See the state it makes, with no model run: cyber-agentkit skill case try <skill folder> no-safe-version
set -e
cat > package.json <<'J'
{ "name": "demo", "version": "1.0.0", "dependencies": { "old-parser": "2.3.1" } }
J
echo 'lockfileVersion: 9' > pnpm-lock.yaml
cat > ci.log <<'L'
pnpm audit --audit-level=high
┌─────────────────────┬────────────────────────────────────────┐
│ high                │ Prototype pollution in old-parser      │
│ Package             │ old-parser                             │
│ Vulnerable versions │ <=2.3.1                                │
│ Patched versions    │ <0.0.0                                 │
│ More info           │ https://github.com/advisories/GHSA-xxxx-xxxx-xxxx │
└─────────────────────┴────────────────────────────────────────┘
1 vulnerabilities found
L
git add -A && git commit -qm "chore: start" && git rev-parse HEAD > .git/case-start
