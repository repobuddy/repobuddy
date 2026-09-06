---
'repobuddy': patch
---

`to-question`: sort dialect references by family instead of by platform name.

`assets/github.md`, `assets/gitlab.md` and `assets/asana.md` are folded into `assets/markdown.md`,
which now carries the Markdown baseline, a per-platform capability table (headings, tables, task
lists, strikethrough, alerts, code blocks) and short platform notes for the quirks that change what
gets written. `assets/` holds one file per dialect family — Markdown, Slack mrkdwn, Jira wiki
markup, and email — so a new Markdown-family platform costs a row rather than another near-duplicate
file. A platform the skill has no row for falls back to the Markdown baseline and says so.
