---
"repobuddy": minor
---

`agent-readiness` adds `instructions-scope`, a level-3 check (not a gate) for whether the always-loaded instructions file says what the project is for and what it deliberately is not. The script finds a scope, purpose, or non-goals statement in the instructions file or in a local file it names, and fails when a well-known scope file (`GOALS.md`, `SCOPE.md`, `VISION.md`, …) exists but nothing points to it. The agent judges whether the boundary is specific enough to reject a real change. `improve` drafts 2-4 lines for `AGENTS.md` and a `GOALS.md` (goals, non-goals, rejected directions), and the owner decides every boundary.
