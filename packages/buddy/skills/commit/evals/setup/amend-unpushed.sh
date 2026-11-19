#!/bin/sh
# The setup of case amend-unpushed: it runs in each run's folder before the model starts, with and without the skill.
set -e
# A start commit, recorded in .git/case-start, then the commit the case is about: a README with a typo.
printf '# demo\n' > README.md
git add README.md
git commit -qm "chore: start the case"
git rev-parse HEAD > .git/case-start
printf '# demo\n\nYou will recieve a greeting.\n' > README.md
git add README.md
git commit -qm "docs: describe the greeting"
git rev-parse HEAD > .git/case-unit
# No remote exists: the commit is on no remote.
