---
"repobuddy": minor
---

`min-release-age`: a lift now schedules its own removal. When the repo has no cleanup job, the skill installs it in the same change as the lift instead of offering it. `release-age lift` reports the `ci` block (`--json`) and ends its summary with a `cleanup job:` line that says whether the job is installed and which provider and reference to use.
