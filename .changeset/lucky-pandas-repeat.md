---
'repobuddy': patch
---

Fix two parsing defects in the `review-permissions` scanner.

A `writable_roots` array spanning multiple lines parsed as the string `"["`, so the directories it granted write access to were dropped from the report and replaced by a finding for a directory named `[`. Continuation lines are now consumed until the brackets balance, and any line the reader cannot parse is counted into a note rather than skipped in silence.

Subsumption also matched on a raw string prefix, which read `git committish foo` as already covered by `git commit *` and advised deleting a rule that was never covered. The prefix now has to land on a token boundary, so `pnpm test:*` still covers `pnpm test:watch` while `git commit` no longer swallows `git committish`.
