#!/bin/sh
# The setup of case staged-only: it runs in each run's folder, a git repository with the case's files committed, before
# the model starts, with and without the skill. Make the state the case needs here, such as commits and uncommitted
# work; the prompt then holds only the request. It runs contained: it writes only to the run's folder and its empty
# HOME, and has no network. The run's .git/hooks and .git/config are read-only, so a write there fails with
# "Read-only file system" or "Device or resource busy". To install a git hook, commit it in a tracked folder and point
# git at it from the run's own HOME:
#   mkdir -p hooks && cp ... hooks/commit-msg && chmod +x hooks/commit-msg
#   git config --global core.hooksPath "$PWD/hooks"
# Set any other git config with --global too. A non-zero exit reports the run as not run, with this script's output.
# See the state it makes, with no model run: cyber-agentkit skill case try <skill folder> staged-only
set -e
# A start commit, recorded in .git/case-start; then the parser fix and its test staged, the index's tree recorded in
# .git/case-index; then more of src/parser.js, a README.md edit, and an untracked notes.txt, none of them staged.
mkdir -p src test
cat > package.json <<'EOF'
{
  "name": "demo-csv",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "test": "node --test"
  }
}
EOF
cat > src/parser.js <<'EOF'
export function parse(line) {
  return line.split(',')
}
EOF
cat > test/parser.test.js <<'EOF'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parse } from '../src/parser.js'

test('splits on commas', () => {
  assert.deepEqual(parse('a,b'), ['a', 'b'])
})
EOF
printf '# demo-csv\n\nParses one CSV line.\n' > README.md
git add package.json src test README.md
git commit -qm "chore: start the case"
git rev-parse HEAD > .git/case-start
cat > src/parser.js <<'EOF'
export function parse(line) {
  return line.split(',').map((field) => field.trim())
}
EOF
cat >> test/parser.test.js <<'EOF'

test('trims each field', () => {
  assert.deepEqual(parse('a, b'), ['a', 'b'])
})
EOF
git add src/parser.js test/parser.test.js
git write-tree > .git/case-index
cat >> src/parser.js <<'EOF'

export function parseAll(text) {
  return text.split('\n').map(parse)
}
EOF
printf '# demo-csv\n\nParses CSV lines.\n' > README.md
printf 'try quoted fields next\n' > notes.txt
