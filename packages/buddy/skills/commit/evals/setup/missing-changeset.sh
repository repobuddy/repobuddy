#!/bin/sh
# The setup of case missing-changeset: it runs in each run's folder, a git repository with the case's files committed,
# before the model starts, with and without the skill. Make the state the case needs here, such as commits and
# uncommitted work; the prompt then holds only the request. It runs contained: it writes only to the run's folder and
# has no network. A non-zero exit reports the run as not run, with this script's output.
set -e
# A published package in a changesets repository: a start commit, recorded in .git/case-start, then the
# parser fix with its test and no changeset.
mkdir -p src test .changeset
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
cat > .changeset/config.json <<'EOF'
{
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "access": "public",
  "baseBranch": "main"
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
git add package.json .changeset src test
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
