#!/bin/sh
# The setup of case sandbox-blocked: it runs in each run's folder, a git repository with the case's files committed, before
# the model starts, with and without the skill. Make the state the case needs here, such as commits and uncommitted
# work; the prompt then holds only the request. It runs contained: it writes only to the run's folder and its empty
# HOME, and has no network. The run's .git/hooks and .git/config are read-only, so a write there fails with
# "Read-only file system" or "Device or resource busy". To install a git hook, commit it in a tracked folder and point
# git at it from the run's own HOME:
#   mkdir -p hooks && cp ... hooks/commit-msg && chmod +x hooks/commit-msg
#   git config --global core.hooksPath "$PWD/hooks"
# Set any other git config with --global too. A non-zero exit reports the run as not run, with this script's output.
# See the state it makes, with no model run: cyber-agentkit skill case try <skill folder> sandbox-blocked
set -e
mkdir -p src
cat > src/parser.js <<'EOF'
export function parse(line) {
  return line.split(',')
}
EOF
git add src/parser.js
git commit -qm "chore: start the case"
git rev-parse HEAD > .git/case-start
cat > src/parser.js <<'EOF'
export function parse(line) {
  return line.split(',').map((field) => field.trim())
}
EOF
printf 'scratch\n' > notes.txt
# the harness's sandbox keeps .git read-only: git add fails creating .git/index.lock
chmod a-w .git
