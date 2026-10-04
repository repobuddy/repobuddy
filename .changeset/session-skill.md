---
"repobuddy": major
---

Replace the `pause-session` and `resume-session` skills with one `session` skill: `session pause`, `session resume`, and `session help`. The old names are removed with no aliases; invoke `/session pause` and `/session resume` instead (natural phrasing such as "let's stop here" or "pick up X" still routes). `session pause` now writes a topic that belongs to another repo into that repo's `.agents/repobuddy/checkpoints/`, with its branch, commit, and paths taken from that repo and a new `repo:` field, and gives the line to type to resume it from a session there. `--commit` commits only the checkpoints in the current repo. `session resume` warns when a checkpoint's `repo:` names another repo before checking its branch and commit.
