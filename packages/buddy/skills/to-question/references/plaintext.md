# Plain Text

**No markup at all.** This is the dialect where every convention the other references teach is
wrong: `**bold**` renders as literal asterisks, `## Context` renders as literal hashes, and a
triple-backtick fence renders as three backticks followed by your diagram in a proportional font.

Use this when:

- the target is `bugzilla` and the instance is in its **default plain-text mode** — the usual case,
  and the one this skill assumes unless the user says otherwise.

## The mode problem

Every other target's dialect is a property of the *platform*. Bugzilla's is a property of the
*instance*, and one level deeper than that: Markdown rendering is a **per-user preference** and a
**per-comment "Use Markdown for this comment" checkbox**. Two Bugzilla instances that look identical
accept different markup, and on the same instance two comments by the same person can differ.
Nothing in the URL or in the user's phrasing reveals which.

**So default to plain text, and say so.** The asymmetry decides it: Markdown pasted into a
plain-text comment renders as literal punctuation and is unreadable; plain text pasted into a
Markdown-enabled comment is merely unstyled. One failure is loud and ugly, the other is invisible.

Say which mode was assumed, in one line at the end of the reply:

> Formatted as plain text, the Bugzilla default. If your instance has Markdown enabled and you tick
> "Use Markdown for this comment", say the word and I'll redo it.

If the user says the instance is in Markdown mode, use [markdown.md](./markdown.md) and its
`bugzilla` row instead — GFM minus inline images and inline HTML.

## What structure is available

Three things, and nothing else:

| Device | How | Notes |
|---|---|---|
| Blank lines | one between paragraphs, one above and below a labelled section | the only paragraph separator there is |
| Capitalised labels | `CONTEXT`, `THE PROBLEM`, `OPTIONS`, `QUESTIONS` on their own line | this is what replaces headings |
| Indentation | two spaces for a list item, four for a block that must stay together | this is what replaces bullets and fences |
| Bare URLs | paste the URL itself | Bugzilla auto-linkifies URLs, `bug 12345`, `comment 5` and `attachment 7` — never wrap them in link markup |
| `>` quoting | `> quoted line` | the one punctuation Bugzilla does treat specially; use it for quoting, not for callouts |

**Numbered questions still work** — `1.` is not markup, it is a number and a full stop, and it reads
the same rendered or not. Keep them.

**The ASCII diagram loses its monospace guarantee.** There is no fence to put it in, so the reader
sees it in whatever font their Bugzilla renders comments in — usually proportional, which breaks the
alignment a box diagram depends on. Two consequences: prefer prose or an indented list where the
diagram was decorative, and where a diagram genuinely carries the meaning, keep it narrow, indent it
four spaces, and say in the line above what it shows so the meaning survives a broken layout.

## Template

The composition changes here, not only the rendering — this is a different template, not the shared
one with the markup stripped.

````
Ask the question directly, in one line. No label.

CONTEXT

Brief background — what are we building, what constraint exists. Keep paragraphs
short; there is no formatting to break up a wall of text.

THE PROBLEM

Concrete example showing the issue. Where a diagram carries the meaning, say what
it shows, then indent it four spaces:

    retry 1 ---- 30s ----> retry 2 ---- 30s ----> give up
                                                  (last attempt dropped)

OPTIONS

Option A: Name
  Gains: what it buys us.
  Costs: what it takes away.

Option B: Name
  Gains: what it buys us.
  Costs: what it takes away.

QUESTIONS

1. Which option aligns best with our architecture?
2. Should this be a dev-mode warning or silent behaviour?

RESEARCH

  https://example.com/doc — one-line summary
  https://example.com/prior-art — one-line summary
````

The `unblock` shape uses the same devices: `BLOCKED ON`, `ALREADY TRIED`, `WHAT I NEED FROM YOU`,
`BY WHEN` as capitalised labels, with the named ask as ordinary prose under its label.

## Tips

- Never emit `#`, `*`, `_`, `~`, backticks, pipes, or `[text](url)` — all of them render literally
- Bare URLs are already links; `[text](url)` is not, and shows both halves as text
- Capitalised labels carry the sections — do not fall back to `--- Context ---` rules or `===` bars,
  which are noise a label already handles
- Two blank lines before a label and one after is enough separation; more just makes the comment long
- Say the mode you assumed, every time. Choosing for the user is fine; choosing silently is not
