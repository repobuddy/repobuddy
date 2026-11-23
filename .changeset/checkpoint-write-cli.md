---
'repobuddy': minor
---

Add `buddy checkpoint write <slug> [<repo path>] [--home]` and `buddy checkpoint mark-resumed <path> --harness <name> --session <id> [--pid <pid>]`. The `checkpoint` skill's `save` and `resume` now write the checkpoint and its `resumed:` marker through them, because Claude Code's file tools refuse to write under `.git/`, where checkpoints live.
