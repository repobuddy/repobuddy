---
'repobuddy': patch
---

`checkpoint` works from a session started outside the repo. `save` gives the hand-off to the repo's root, not the plain resume line, when the session was launched outside the checkpoint's home repo, and writes the resume line in the form `command.md` gives. `checkpoint list` outside a repo says that each repo keeps its own checkpoints and names the repos below the current folder that hold some (`nearby` in `--json`), so `resume` can point to the folder to start in instead of reporting nothing.
