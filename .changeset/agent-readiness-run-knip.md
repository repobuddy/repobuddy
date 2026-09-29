---
"repobuddy": minor
---

`agent-readiness score --run-knip` runs the repository's knip command and settles the `dead-code` check itself: pass when knip reports nothing, fail with knip's report headings (`Unused exports (4)`) when it does. Without the flag, `score` still only names the command for the agent to run. The flag is opt-in because it runs the repo's own tooling and needs dependencies installed, so it fits CI, where no agent is there to run knip.
