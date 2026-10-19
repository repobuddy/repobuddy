# agent-skills

Ship installable agent skills to consumers. A consumer runs `npx skills add repobuddy/repobuddy` and
gets the skills under `skills/` — each one a `SKILL.md` plus whatever material it loads at runtime.

One unit per shipped skill.

| Unit | Subject |
|---|---|
| [merge-dep-prs](./merge-dep-prs/README.md) | Merge dependency-update PRs — **the merge gate only** |
| [to-question](./to-question/README.md) | Format a question or discussion for a target platform |
| [issue](./issue/README.md) | File one bug, feature, or task on the tracker, after a duplicate check |
| [epic](./epic/README.md) | Plan an epic and its child issues, promote an issue to an epic, demote an initiative to one, across trackers |
| [initiative](./initiative/README.md) | Set an initiative's goal and metric with its epics as shells, and promote an epic to one as a new parent |
| [project-tracker](./project-tracker/README.md) | Set up, show, change, and check which tracker holds each level and category, and the move policy between trackers |
| [scaffold](./scaffold/README.md) | List the installed scaffold recipes and apply one after a single confirmation |
| [work-references](./work-references/README.md) | The level checks, body templates, and tracker contract the level skills load by name |

Skills present in `skills/` with no unit here are **not yet backfilled** — `agent-readiness`,
`init-buddy`, `min-release-age`, `checkpoint`, `setup-github-repo`, `setup-npm-trusted-publishing`, `website`. They are a
standing worklist, not a claim that they are unspecified by design.

`merge-dep-prs` is **partially** backfilled: its unit specifies the merge gate and nothing else. The
rest of that skill — PR classification, CI triage, the fix recipes, changesets, closing obsolete PRs
— stays on the same worklist. When that rest lands in the same unit, its H1 (`merge-dep-prs — the
merge gate`) and the scoping paragraph in its `## What` both have to go; note it here so the rename
is not discovered late.
