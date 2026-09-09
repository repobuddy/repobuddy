---
'repobuddy': patch
---

`to-question`: support the non-Markdown trackers — Bugzilla, Redmine and Trac.

Markdown renders in none of them, so the baseline every unlisted platform falls back to is the one
dialect that must never be used there. Each gets its own dialect reference, the way Slack mrkdwn and
Jira wiki markup already do: `references/plaintext.md` for Bugzilla's default mode, where no markup
renders at all, `references/textile.md` for Redmine's, and `references/trac.md` for Trac's one fixed
dialect. A Markdown-mode Bugzilla is a row in the capability table instead — GFM minus inline images
and inline HTML, both of which Bugzilla strips.

These are the first targets whose dialect is a property of the *instance* rather than of the
platform. Bugzilla is plain text by default with Markdown switchable per user preference and per
comment; Redmine is Textile by default with CommonMark set instance-wide. Nothing in the request
reveals which, so the skill composes for the product default and says which mode it assumed, with the
one-line switch — the same rule the Slack default and the Markdown fallback already follow.

Plain text is the one target where the composition changes rather than only the markup: with no
headings and no fenced blocks, sections are carried by blank lines and capitalised labels, and an
ASCII diagram loses its monospace guarantee, so `plaintext.md` ships a template variant.

`scripts/check-format.mjs` gains `bugzilla`, `bugzilla-markdown`, `redmine` and `trac`. Its
verbatim-region detection is now dialect-specific rather than always a ``` fence, which also fixes a
Jira rule that could never fire: the "Markdown code fence" scan ran over lines the fence pass had
already blanked, so a fenced block in a Jira draft went unreported.
