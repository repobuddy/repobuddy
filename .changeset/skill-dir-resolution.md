---
"repobuddy": patch
---

`setup-github-repo` and `setup-npm-trusted-publishing` find their bundled scripts in the skill's own directory. They called `npx skills path`, a command the Skills CLI does not have, so the lookup always fell back to a guessed install path and then to `npx repobuddy`.
