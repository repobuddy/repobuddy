#!/bin/sh
# The setup of case save-outside-repo: the session starts in a folder that is not a git repo and holds one repo,
# app/, where the session's work is: a null guard in parse.js, written but not tested or committed. See the state it
# makes, with no model run: cyber-agentkit skill case try <skill folder> save-outside-repo
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
cat > parse.js <<'JS'
export function parse(input) {
	if (input === null) throw new TypeError('null input')
	return JSON.parse(input)
}
JS
