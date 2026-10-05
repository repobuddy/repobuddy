---
"repobuddy": minor
---

`agent-readiness`: `instructions-scope` scores a monorepo per package. The root passes on a statement in its instructions file of what belongs in the repo, with no root `GOALS.md` expected. Each workspace package that is not `private` passes on a `GOALS.md` (or another scope file) inside it that its own `AGENTS.md`/`CLAUDE.md` or the root instructions file names, or on a scope line in its own `AGENTS.md`. Private packages (apps, docs sites, fixtures) are skipped. The check fails when the root or any counted package fails and lists each; it stays level 3 and not a gate. `improve` drafts the root lines and one `GOALS.md` per failing package. Single-package repos are scored as before.
