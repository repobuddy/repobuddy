#!/bin/sh
# The setup of case resume-summary: it runs in each run's folder, a git repository with the case's files committed, before
# the model starts, with and without the skill. Make the state the case needs here, such as commits and uncommitted
# work; the prompt then holds only the request. It runs contained: it writes only to the run's folder and its empty
# HOME, and has no network. The run's .git/hooks and .git/config are read-only, so a write there fails with
# "Read-only file system" or "Device or resource busy". To install a git hook, commit it in a tracked folder and point
# git at it from the run's own HOME:
#   mkdir -p hooks && cp ... hooks/commit-msg && chmod +x hooks/commit-msg
#   git config --global core.hooksPath "$PWD/hooks"
# Set any other git config with --global too. A non-zero exit reports the run as not run, with this script's output.
# See the state it makes, with no model run: cyber-agentkit skill case try <skill folder> resume-summary
set -e

# The checkpoint's branch and commit match the run's, so the resume checks pass. Its open question blocks NEXT, so the
# run stops after its opening, and the reply shows whether that opening summarizes the work before the mechanics.
mkdir -p src test
cat > src/parser.js <<'EOF'
export function parse(line) {
  return line.split(',').map((field) => field.trim())
}
EOF
cat > test/parser.test.js <<'EOF'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parse } from '../src/parser.js'

test('trims each field', () => {
  assert.deepEqual(parse('a, b'), ['a', 'b'])
})
EOF
printf '{ "name": "demo-csv", "type": "module", "scripts": { "test": "node --test" } }\n' > package.json
git add package.json src test
git commit -qm "fix: trim each parsed field"
commit=$(git rev-parse --short HEAD)
d="$(git rev-parse --path-format=absolute --git-common-dir)/repobuddy/checkpoints"
mkdir -p "$d"
cat > "$d/trim-fields.md" <<MD
---
focus: trim-fields
repo: $(basename "$PWD")
branch: $(git branch --show-current)
commit: $commit
created: 2026-11-20
updated: 2026-11-21
---

# Trim whitespace in parsed CSV fields

## NEXT — resume here

Once the open question is answered, add a test in test/parser.test.js that a quoted field keeps its inner
spaces (\`parse('" a ",b')\`), with its quotes kept or stripped as answered, run \`npm test\`, and make it pass
in src/parser.js.

## Goal

demo-csv's \`parse\` returned fields with the spaces around commas, so callers compared " b" with "b".
Done when every field is trimmed and a quoted field keeps its spaces.

> Trim the fields, but leave quoted ones alone.

## Done so far

- Unquoted fields are trimmed, with a test — $commit

## Remaining steps

- Document the trimming in README.md.

## Settled decisions

- Trim in \`parse\`, not in each caller — user said.

## Open questions

- Does a quoted field come back with its quotes (\`'" a "'\`) or without them (\`' a '\`)? It blocks NEXT, and
  only the user can answer it — options: keep the quotes / strip them.

## Working method

\`npm test\` after each change; one commit per change.

## Touched

- src/parser.js, test/parser.test.js — the parser and its tests.

## Not in git

nothing
MD
