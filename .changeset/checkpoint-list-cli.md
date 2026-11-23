---
'repobuddy': minor
---

Add `buddy checkpoint list [<repo path>] [--json]`, which lists the checkpoints the `checkpoint` skill reads, newest first. Each row shows the branch and where it is checked out, the `## NEXT` line, `waits on <slug>`, and the liveness of a `resumed:` marker. The skill's `list` subcommand now runs it instead of walking the folders itself.
