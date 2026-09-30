---
"repobuddy": minor
---

`agent-readiness score` adds an `env-documented` check to the environment area. It collects the `process.env.X` and `import.meta.env.X` names read in non-test JS and TS source and fails with each name that no instructions file, README, CONTRIBUTING, or `.env.example` mentions. Names the OS, shell, package manager, CI runner, or bundler sets (`NODE_ENV`, `CI`, `HOME`, `npm_*`, `GITHUB_*`) are skipped. The check is not a gate, so it ranks in the fix list without changing the level.
