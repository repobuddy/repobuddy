---
'repobuddy': minor
---

Add the `llms-txt` skill.

`llms.txt` is the orientation file an agent reads before using a package or site: what the project
is, the conventions that govern its whole surface, and where the per-item detail lives. The skill
generates it from the project's real public surface rather than hand-writing it — a hand-written one
rots into describing an API that was removed two releases ago — wires a drift check into the command
CI already runs, and reports the documentation gap that generating from the real surface exposes
instead of trying to fill it in the same change.

It also draws the audience boundary against `AGENTS.md`: `llms.txt` addresses whoever consumes the
published thing, `AGENTS.md` whoever changes the repo. A project with no public surface needs only
the second, and the skill says so rather than generating a file with no reader.
