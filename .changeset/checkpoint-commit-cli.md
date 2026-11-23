---
'repobuddy': minor
---

Add `buddy checkpoint commit [<slug>...] [--drop <slug>...] [--allow <word>...]`, which commits copies of checkpoints after checking them for absolute paths, usernames and hostnames. The `checkpoint` skill's `save --commit` runs it instead of copying, grepping, force-adding and committing step by step.
