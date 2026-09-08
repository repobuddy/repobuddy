# agent-skills

Ship installable agent skills to consumers. A consumer runs `npx skills add repobuddy/repobuddy` and
gets the skills under `skills/` — each one a `SKILL.md` plus whatever material it loads at runtime.

One unit per shipped skill.

| Unit | Subject |
|---|---|
| [merge-dep-prs](./merge-dep-prs/README.md) | Merge dependency-update PRs — **the merge gate only** |
| [to-question](./to-question/README.md) | Format a question or discussion for a target platform |

Skills present in `skills/` with no unit here are **not yet backfilled** — `create-issue`,
`setup-github-pages`, `setup-github-repo`, `setup-npm-trusted-publishing`. They are a standing
worklist, not a claim that they are unspecified by design.

`merge-dep-prs` is **partially** backfilled: its unit specifies the merge gate and nothing else. The
rest of that skill — PR classification, CI triage, the fix recipes, changesets, closing obsolete PRs
— stays on the same worklist. When that rest lands in the same unit, its H1 (`merge-dep-prs — the
merge gate`) and the scoping paragraph in its `## What` both have to go; note it here so the rename
is not discovered late.
