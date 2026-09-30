---
"repobuddy": minor
---

`agent-readiness score` adds a `fixtures-excluded` check to the noise area. It lists tracked fixture and vendored folders (`fixtures/`, `__fixtures__/`, `testcases/`, `__snapshots__/`, `vendor/`, `third_party/`, and similar) whose files no `.gitignore`, `.ignore`, or `.rgignore` excludes from search, with the count of files search still reads. The agent judges which ones search should skip. The check is not a gate, so it ranks in the fix list without changing the level.
