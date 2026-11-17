#!/bin/sh
# The setup of case amend-pushed: it runs in each run's folder before the model starts, with and without the skill.
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
# The commit is on a remote: a remote-tracking ref stands for the push. The ref is recorded to check it stays.
git update-ref refs/remotes/origin/main HEAD
