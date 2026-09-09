---
name: to-question
description: Use this skill when wording a question or unblock ping for Slack, Jira, Linear, Asana, Bugzilla, Redmine, Trac or email.
---

# Question Formatter

Format a technical question, design discussion, or decision request for posting to a platform.

## Supported Formats

| Format | Platform | Pasted as | Dialect reference | Default |
|--------|----------|-----------|-------------------|---------|
| `slack` | Slack | a channel or DM message | `references/slack.md` | ✓ |
| `asana` | Asana | a comment on an existing task | `references/markdown.md` | |
| `jira` | Jira | a comment on an existing issue | `references/jira.md` | |
| `github` | GitHub | a comment on an existing issue or PR | `references/markdown.md` | |
| `gitlab` | GitLab | a comment on an existing issue or MR | `references/markdown.md` | |
| `linear` | Linear | a comment on an existing issue | `references/markdown.md` | |
| `bugzilla` | Bugzilla | a comment on an existing bug | `references/plaintext.md` — or `references/markdown.md` in Markdown mode | |
| `redmine` | Redmine | a comment on an existing issue | `references/textile.md` — or `references/markdown.md` in CommonMark mode | |
| `trac` | Trac | a comment on an existing ticket | `references/trac.md` | |
| `email` | Email | the body of an email | `references/email.md` | |
| `markdown` | Markdown baseline | fallback for any unlisted *private* platform | `references/markdown.md` | |

**The tracker targets produce a comment on an item that already exists — not a new task, issue, or ticket.** That distinction is the whole boundary with `create-issue`: if the user wants the item to *exist*, that is `create-issue`'s job, and it searches for duplicates first. This skill words what you say *on* an item. So write the opening as someone speaking into an existing thread: **do not restate the item's own title or re-describe what it is about**, since the reader is already looking at it. Still open by **asking the question directly in one line** — that is the question, not the item's title, and a comment needs it just as much.

## Supported Shapes

Two things are chosen independently: the **content shape** (which sections the draft has) and the
**dialect** (which markup it is rendered in). The table above is the dialect; this one is the shape.

| Shape | Use when | Sections | Default |
|-------|----------|----------|---------|
| `question` | The user is undecided between alternatives and wants input | Context → Use Cases → Problem → Options → Questions | ✓ |
| `unblock` | The user is stuck and needs a named person to do a named thing | Blocked on → Already tried → **What I need from you** → By when | |

`question` is the default, so a request that names no shape composes exactly as it always has. Pick
`unblock` when the user's own words say they are blocked — *blocked*, *stuck*, *waiting on*, *can't
proceed until*, *need access to*, or a request that already carries a deadline.

**The two shapes are not interchangeable, and the wrong one fails quietly.** Composing a blocked
person's ping into the `question` shape makes the agent manufacture an Options section for a request
that has no options, and leaves the ask and the deadline — the two things that make a ping work —
with nowhere to go.

## Procedure

1. **Determine the content shape.** Default to `question`; choose `unblock` when the user says they are blocked, stuck, or waiting on someone. **If you chose `unblock` rather than being told to, say so in one line at the end of your reply** — "Shaped as an unblock ping rather than a question, since you're waiting on someone; say the word if you'd rather present it as options." The `question` default needs no announcement: it is the status quo, and the draft in front of the user already shows its own sections
2. Load the shape file — [references/shape-question.md](./references/shape-question.md) or [references/shape-unblock.md](./references/shape-unblock.md). It names the sections and the rules that go with them; the dialect file names the markup
3. Determine target format from user input. **If the user named no platform, use `slack`** — and say so at the **end of your reply**: "Formatted for Slack (the default) — say the word if you want Jira, Linear, Asana, GitHub, GitLab, Bugzilla, Redmine, Trac or email instead." Choosing for the user is fine; choosing silently is not, because a draft in the wrong dialect looks correct right up until it is pasted
4. Load the dialect reference. Assets are sorted by **dialect family, not by platform name**: `slack`, `jira`, `redmine` and `trac` have their own files because none of them accepts Markdown at all, `bugzilla` has [references/plaintext.md](./references/plaintext.md) because by default it accepts no markup whatsoever, and `email` has one because it is pasted as rich text. **Every Markdown-family target — `github`, `gitlab`, `asana`, `linear`, `markdown` — loads [references/markdown.md](./references/markdown.md)** and takes its specifics from that file's capability table and platform notes. A platform served by the shared file is a supported target, so loading the baseline for it is normal routing, **not** a fallback: do not announce it as one
5. **Resolve the markup mode where the instance decides it, and state the assumption.** On `bugzilla` and `redmine` the dialect is a property of the *instance*, not of the platform — Bugzilla is plain text by default with Markdown switchable per user preference **and** per comment, and Redmine is Textile by default with CommonMark set instance-wide by an administrator. Nothing in the URL or the user's phrasing reveals which. **Default to the product default** — `plaintext` for Bugzilla, `textile` for Redmine — and **say which mode you assumed, with the switch**, in one line at the end of the reply, the same rule the Slack default and the Markdown fallback already follow:

   > Formatted as plain text, the Bugzilla default. If your instance has Markdown enabled and you tick "Use Markdown for this comment", say the word and I'll redo it.

   If the user has already said which mode the instance is in, use it and announce nothing — that is their statement, not your guess. `trac` has one fixed dialect, so there is no mode to assume and nothing to say. **The asymmetry is what picks the default**: Markdown pasted into a plain-text Bugzilla comment renders as literal `**asterisks**` and `## hashes`, while plain text pasted into a Markdown-enabled one is merely unstyled — one failure is unreadable, the other is invisible
6. **If the user named a platform not in the table at all**, split on who the audience is — an unlisted platform is not automatically a fallback case:

   - **A public venue is out of scope. Route it, do not compose it.** `stackoverflow`, `x`/`twitter`, `bluesky`, `reddit`, `discord`, `telegram`, `facebook`, `linkedin` — any venue whose readers have no prior context and did not ask. Point the user at **`research-workbench:community-post`** and say why in one line: a public post has to restate the context, cite prior art, and survive a search for an existing answer, and this skill does none of those. This is a boundary, not a missing dialect file: no `references/<venue>.md` would fix it, because the gap is the composition, not the markup. This holds whatever shape was resolved in step 1 — the venue is out of scope because its readers have no prior context, and no shape supplies that. If the user says they want the draft anyway, compose it on the Markdown baseline, but repeat that the venue's own norms are not covered
   - **An unlisted private venue is a fallback case.** `notion`, `teams`, anything else whose audience is already on the item or in the room — load `references/markdown.md`, treat the capability table's `anything else` row as unverified, and **tell the user you fell back to the Markdown baseline**. Never fall back silently, and never fall back to Markdown for Slack, Jira, Redmine, Trac or a plain-text Bugzilla, none of which accept it
7. Take the user's question/topic and any context they provide
8. Structure the content into the shape's sections, rendered with the dialect's markup rules
9. **Check the markup before showing it.** Write the draft to a temp file and run the bundled checker — it catches dialect mistakes that look fine in your reply and only break on paste:

   ```bash
   QUESTION_FILE=$(node <this-skill-dir>/scripts/question-path.mjs)
   # ...write the draft to "$QUESTION_FILE"...
   node <this-skill-dir>/scripts/check-format.mjs <target> "$QUESTION_FILE"
   ```

   **Derive the path with `question-path.mjs`; never hardcode `/tmp/question.md`.** The script resolves the
   OS temp directory (honoring `TMPDIR`/`TEMP`, so it is right on Linux, macOS, WSL and native Windows) and
   puts the file in a fresh private directory with a random name, so two sessions on a shared machine cannot
   collide or read each other's draft. Run it **once** and reuse that path for the rest of the session — each
   run makes a new directory.

   `<this-skill-dir>` is the directory holding this SKILL.md — **not** your current working directory. A bare `scripts/check-format.mjs` resolves against wherever you happen to be and will fail. Use the absolute path.

   Fix anything it reports, then re-run until clean. It knows the per-target rules (Slack's single-asterisk bold and `•` bullets, Jira's `h2.` headings and `[text|url]` links, Linear's four-level heading cap, email's subject-outside-the-body, Textile's `h2.` headings, Trac's `'''bold'''` and `||cells||`, and a plain-text Bugzilla's rejection of every markup family at once) and it skips each dialect's own verbatim regions — a ``` fence on the Markdown-family targets, `{code}`/`{noformat}` on Jira, `<pre>` on Redmine, `{{{ }}}` on Trac, a four-space indent on plain-text Bugzilla — so diagrams and code samples are never flagged.

   **Bugzilla's two modes are two checker targets.** Pass `bugzilla` for the plain-text default and `bugzilla-markdown` for a Markdown-enabled instance; they enforce opposite rules, so passing the wrong one passes a draft that will not render
10. Display the formatted output in the reply (inside a fenced code block with 4 backticks so nested triple-backticks render correctly)
11. Ask if the user wants any changes — iterate until they're happy
12. Once approved, keep `$QUESTION_FILE` in sync with the final draft and hand off (below)

## Handoff

After the user approves the output, write it to `$QUESTION_FILE` (the path derived in step 9), then copy it to the clipboard using the first of these that exists on this machine — check with `command -v <cmd>` before running it:

```bash
# macOS
cat "$QUESTION_FILE" | pbcopy

# Windows/WSL
cat "$QUESTION_FILE" | clip.exe

# Linux, Wayland
cat "$QUESTION_FILE" | wl-copy

# Linux, X11 (requires xclip or xsel)
cat "$QUESTION_FILE" | xclip -selection clipboard
```

On success, tell the user: "Copied to clipboard — paste into [platform]."

**If no clipboard command is available** — a headless agent, a CI run, a container, a web session — say so plainly instead of claiming success:

> No clipboard available here. The formatted question is at `<the derived path>`, and it's in the output above to copy from.

Give the real path, not the placeholder — the user cannot open a file whose name they were not told.

Never report "Copied to clipboard" unless a copy command actually ran and succeeded. The clipboard is the handoff, so a silent failure loses the output the user just approved.

**Email is the exception.** The clipboard carries Markdown, but email composers want rich text. For the `email` target, tell the user to render the Markdown first and paste the *rendered* result — see [references/email.md](./references/email.md).

## Content Guidelines

The sections below are the **`question`** shape — the default. For the `unblock` shape, its sections
and its two load-bearing rules (the ask names a person and one action; the deadline is stated even
when there is none) are in [references/shape-unblock.md](./references/shape-unblock.md). The unlabelled opening line and
the ASCII-diagram guidance below apply to both shapes.

Regardless of format, a good question includes:

- **The question, first and unlabelled**: open by asking it directly, in one line. Do not put a `Title:`, `Summary:`, or `Ask:` label in front of it — the line *is* the question, and a label just adds a word the reader has to skip. This opening line is what stops the actual question being buried at the bottom, and **every target gets it, with no exceptions** — comments and email alike. Email's subject is handed to the user as a separate line to type into the client's Subject field; it never appears inside the pasted body, where it would be a heading duplicating what the reader can already see
- **Context**: Brief background — what we're building, constraints. On a comment, this is what the *thread* does not already cover, not a restatement of the item
- **Use Cases** (if applicable): Concrete scenarios showing expected behavior
- **Problem/Edge Case**: The specific issue with code/diagrams if helpful
- **Options**: 2-4 alternatives. **Derive them yourself when the user brings none** — arriving with a problem and no alternatives is the normal case, not a reason to skip this section, and proposing the candidates is most of the value the skill adds. Give every option a concrete **cost it incurs**, not only what it gains: a list where every entry is upside has not been thought through, and gives the reader nothing to weigh
- **Questions**: Numbered list of specific questions to answer
- **Research** (if applicable): Links to relevant docs or prior art

Use ASCII diagrams in code blocks to visualize architecture, data flow, state transitions, or UI layouts — visuals communicate faster than prose.

**Plain-text Bugzilla is the one target where the composition changes, not only the rendering.** With no markup at all there are no headings and no fences, so the sections are carried by blank lines and CAPITALISED labels, and the diagram loses its monospace guarantee — see [references/plaintext.md](./references/plaintext.md) for the template variant and what to do with a diagram that has to survive a proportional font.

## References

Content shapes — which sections the draft has:

- [references/shape-question.md](./references/shape-question.md) — the question shape (default)
- [references/shape-unblock.md](./references/shape-unblock.md) — the unblock-ping shape, with the named-ask slot

Dialect references, with markup rules, templates and examples. One file per **dialect family**, not per platform:

- [references/markdown.md](./references/markdown.md) — the Markdown family: baseline syntax, a per-platform capability table and platform notes covering `github`, `gitlab`, `asana`, `linear` and a Markdown-mode `bugzilla`; also the fallback for any unlisted platform
- [references/slack.md](./references/slack.md) — Slack mrkdwn (default)
- [references/jira.md](./references/jira.md) — Jira wiki markup
- [references/plaintext.md](./references/plaintext.md) — no markup at all: Bugzilla's default mode, with its own template variant
- [references/textile.md](./references/textile.md) — Textile: Redmine's default mode
- [references/trac.md](./references/trac.md) — Trac wiki markup
- [references/email.md](./references/email.md) — Plain text email, pasted as rich text

Everything but the Markdown family keeps its own file, and for one reason each: Markdown does not
work in Slack, Jira, Redmine, Trac or a default Bugzilla, and email is not pasted as Markdown at all.
Everything else is a row. **Divergence earns a file; headcount does not.**
