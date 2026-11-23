---
"repobuddy": minor
---

`checkpoint resume` now opens with a short summary of the work before it acts: what the work is and its goal, what is done, what is left, and the next step with any open question that blocks it. Branch state and commit ids come after it, briefly. `checkpoint save` writes a `## Done so far` section and a goal that says what the work is, and `resume` still reads checkpoints written without them. `resume` also asks before running a command from a committed checkpoint, or one that reaches outside the repo.
