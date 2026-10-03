---
"repobuddy": minor
---

Add the `pause-session` and `resume-session` skills. `pause-session` writes the state of any agent session to `.agents/repobuddy/checkpoints/<slug>.md`: the next action first, then settled decisions, open questions, working method, touched files and state that isn't in git. On first use in a repo it lists that folder in `.git/info/exclude`, never in the tracked `.gitignore`; `--commit` stages the one checkpoint with `git add -f`. `resume-session` finds that checkpoint, checks it against the repo, and continues from the next step without reopening settled decisions. The names avoid every harness built-in, including `/resume`. SDD missions hand off to cyber-sdd's `pause-mission` and `resume-mission`.
