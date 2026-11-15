#!/bin/sh
# The setup of case hook-reject: it runs in each run's folder, a git repository with the case's files committed, before
# the model starts, with and without the skill. Make the state the case needs here, such as commits and uncommitted
# work; the prompt then holds only the request. It runs contained: it writes only to the run's folder and has no
# network. A non-zero exit reports the run as not run, with this script's output.
set -e
# A start commit with a commit-msg hook in hooks/ that rejects a message without a Refs trailer, recorded
# in .git/case-start; then the parser fix with its test. The sandbox keeps .git/hooks and .git/config
# read-only, so the run's own global git config points core.hooksPath at hooks/.
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
mkdir -p hooks
cat > hooks/commit-msg <<'EOF'
#!/bin/sh
grep -q '^Refs: ' "$1" && exit 0
echo "commit-msg: the message needs a 'Refs: <ticket>' trailer; write 'Refs: none' when there is no ticket" >&2
exit 1
EOF
chmod +x hooks/commit-msg
git add package.json src test hooks
git commit -qm "chore: start the case"
git rev-parse HEAD > .git/case-start
git config --global core.hooksPath "$PWD/hooks"
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
