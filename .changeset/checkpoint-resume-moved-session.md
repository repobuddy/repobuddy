---
"repobuddy": patch
---

`checkpoint resume` notices when a session said to have moved into the checkpoint's repo is still outside it: it checks with `git rev-parse --show-toplevel`, says that a shell `cd` (such as `! cd` in Claude Code) does not move the session, and gives the `/cd` lines again.
