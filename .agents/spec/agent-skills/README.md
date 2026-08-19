# agent-skills

Ship installable agent skills to consumers. A consumer runs `npx skills add repobuddy/repobuddy` and
gets the skills under `skills/` — each one a `SKILL.md` plus whatever material it loads at runtime.

One unit per shipped skill.

| Unit | Subject |
|---|---|
| [to-question](./to-question/README.md) | Format a question or discussion for a target platform |

Skills present in `skills/` with no unit here are **not yet backfilled** — `create-issue`,
`merge-dep-prs`, `setup-github-pages`, `setup-github-repo`, `setup-npm-trusted-publishing`. They are
a standing worklist, not a claim that they are unspecified by design.
