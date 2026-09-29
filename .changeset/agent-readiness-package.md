---
"repobuddy": minor
---

Add `agent-readiness score --package <path>`: scores how cheaply a consumer's agent can use a published package, through what ships rather than the source. Same gated report (levels 1-4, per-area scores, top three fixes) with package criteria: type declarations, a clean `exports` map, no `any` in the public API, a doc comment on each export, README examples, actionable errors, a parseable changelog with breaking changes labelled, and an `llms.txt` with a drift check (fixes hand off to `llms-txt`). Public surface size and a shipped agent skill are reported, not scored.
