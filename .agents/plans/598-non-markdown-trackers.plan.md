---
cr-ref: github-598
target: packages/buddy/skills/to-question
status: active
todos:
  - content: Add the plain-text dialect reference and its template variant (Bugzilla default)
    status: completed
  - content: Add the Textile reference (Redmine) and the Trac wiki-markup reference
    status: completed
  - content: Give Bugzilla Markdown mode a row in the Markdown capability table
    status: completed
  - content: Wire mode resolution and the assumption announcement into SKILL.md
    status: completed
  - content: Extend check-format.mjs with bugzilla, bugzilla-markdown, redmine, trac
    status: completed
  - content: Update the spec node (README, .feature, solution.md) for the new family
    status: completed
  - content: Changeset, PR against #598
    status: completed
---

# CR: non-Markdown trackers for `to-question`

[#598](https://github.com/repobuddy/repobuddy/issues/598). Follow-up from #577.

Bugzilla, Redmine and Trac render no Markdown, so the baseline — the thing every other unlisted
target falls back to — is the one dialect that must never be used there. They are the Slack/Jira
case: a dialect that earns its own reference.

What is new versus every shipped target: **the dialect is a property of the instance, not the
platform.** Bugzilla is plain text by default but has a Markdown mode chosen per user *and* per
comment; Redmine is Textile by default with CommonMark as an instance-wide admin setting. Nothing
in the request reveals which. So the skill defaults to the safe mode (plain text, Textile — both are
the product defaults and both degrade honestly) and **says which mode it assumed, with the switch**.

Trac is kept: one fixed dialect, one more syntax table once the plain-text plumbing exists.

Plain text is the one target where the *composition* changes, not only the rendering: with no
markup, sections are carried by blank lines and capitalised labels, and the ASCII diagram loses its
monospace guarantee.

## NEXT — landed

All seven todos are done. Delivered on `feat/to-question-non-markdown-trackers`:

- `references/plaintext.md`, `references/textile.md`, `references/trac.md`; a Markdown-mode
  `bugzilla` row in the capability table
- mode resolution and the stated assumption in `SKILL.md` (procedure step 5)
- `check-format.mjs` targets `bugzilla`, `bugzilla-markdown`, `redmine`, `trac`, with
  dialect-specific verbatim regions
- spec node README, `.feature` (12 scenarios, 3 trigger rows), `solution.md` fork 5, `eval.md` caveat
- changeset `thick-moons-invent`

Not done, and deliberately: no ACED run. The suite has never been evaluated on this branch or on
`main`, and `validate-skill.mjs` reports the missing run rather than hiding it.
