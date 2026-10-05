---
"repobuddy": minor
---

`agent-readiness bench` hands over to ACED's measured layer. The skill now runs its benchmark through ACED's `bench` skill, or its engine `npx -y -p cyber-aced@^0.4.0 aced-bench`, with the suite `repobuddy.readiness` at `.agents/aced/bench/repobuddy.readiness/`. Level 5 reads that suite's committed `baseline.json`.

`agent-readiness.mjs bench` now prints where the benchmark moved and exits 1. The script no longer plans, runs, or compares a bench itself. If your repo has `.agents/readiness/bench/`, move it with `git mv .agents/readiness/bench .agents/aced/bench/repobuddy.readiness`, point the check paths in `tasks.json` at the new folder, and record a new baseline with ACED. Until you do, level 5 fails. The new `bench convert` subcommand turns an old results file into a version-3 record that `aced-bench compare` can read.
