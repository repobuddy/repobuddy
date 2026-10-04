---
"repobuddy": minor
---

`pause-session` checkpoints now keep what a cold session needs to stay on course: every user request, including ones not started; the user's latest instruction quoted word for word, with their corrections recorded as settled decisions; dead ends not to retry; the harness's pending todo items as remaining steps; and what a half-finished edit does and lacks. With `--commit`, a grep checks for leaked paths, usernames and hostnames before committing. `resume-session` reads the dead ends before acting and works through the remaining steps.
