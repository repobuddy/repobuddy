---
"repobuddy": minor
---

`commit` plans every commit before staging the first, and splits formatting from logic, a refactor from the change after it, and a dependency bump from a behavior change, keeping a change's tests in its commit. It uses fewer tokens: it reads the diff stat before any full diff, runs the smallest check that covers each unit, reuses a check already passed on the same content, reads its references as files instead of loading the `reference` skill, and runs its final checks once. It also reads the staged diff for secrets and debug logging, reports each commit with what and why, and ships `/skill test` evals.
