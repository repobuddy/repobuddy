---
name: to-question
description: Use this skill when wording a question to post as a comment, message, or email in Jira, Linear, Asana, or Slack.
---

# Question Formatter

Format a technical question, design discussion, or decision request for posting to a platform.

## Supported Formats

| Format | Platform | Pasted as | Default |
|--------|----------|-----------|---------|
| `slack` | Slack | a channel or DM message | ✓ |
| `asana` | Asana | a comment on an existing task | |
| `jira` | Jira | a comment on an existing issue | |
| `github` | GitHub | a comment on an existing issue or PR | |
| `gitlab` | GitLab | a comment on an existing issue or MR | |
| `linear` | Linear | a comment on an existing issue | |
| `email` | Email | the body of an email | |
| `markdown` | Markdown baseline | fallback for anything unlisted | |

**The tracker targets produce a comment on an item that already exists — not a new task, issue, or ticket.** That distinction is the whole boundary with `create-issue`: if the user wants the item to *exist*, that is `create-issue`'s job, and it searches for duplicates first. This skill words what you say *on* an item. So write the opening as someone speaking into an existing thread: **do not restate the item's own title or re-describe what it is about**, since the reader is already looking at it. Still open by **asking the question directly in one line** — that is the question, not the item's title, and a comment needs it just as much.

## Procedure

1. Determine target format from user input. **If the user named no platform, use `slack`** — and say so at the **end of your reply**: "Formatted for Slack (the default) — say the word if you want Jira, Linear, Asana, GitHub, GitLab or email instead." Choosing for the user is fine; choosing silently is not, because a draft in the wrong dialect looks correct right up until it is pasted
2. Load the format template. `slack`, `asana`, `jira`, `github`, `gitlab` and `email` each have their own `assets/<format>.md`. **`linear` and `markdown` both load [assets/markdown.md](./assets/markdown.md)** — Linear is Markdown-family and its specifics are a row in that file's capability table, not a file of its own. `linear` is a supported target, so loading the baseline for it is normal routing, **not** a fallback: do not announce it as one
3. **If the user named a platform not in the table at all** — `discord`, `notion`, `teams`, `reddit`, anything unlisted — load `assets/markdown.md` and **tell the user you fell back to the Markdown baseline**. Never fall back silently, and never fall back to Markdown for Slack or Jira, which do not accept it
4. Take the user's question/topic and any context they provide
5. Structure using the template's pattern and markdown rules
6. **Check the markup before showing it.** Write the draft to a temp file and run the bundled checker — it catches dialect mistakes that look fine in your reply and only break on paste:

   ```bash
   node <this-skill-dir>/scripts/check-format.mjs <target> /tmp/question.md
   ```

   `<this-skill-dir>` is the directory holding this SKILL.md — **not** your current working directory. A bare `scripts/check-format.mjs` resolves against wherever you happen to be and will fail. Use the absolute path.

   Fix anything it reports, then re-run until clean. It knows the per-target rules (Slack's single-asterisk bold and `•` bullets, Jira's `h2.` headings and `[text|url]` links, Linear's four-level heading cap, email's subject-outside-the-body) and it skips fenced blocks, so diagrams and code samples are never flagged
7. Display the formatted output in the reply (inside a fenced code block with 4 backticks so nested triple-backticks render correctly)
8. Ask if the user wants any changes — iterate until they're happy
9. Once approved, keep `/tmp/question.md` in sync with the final draft and hand off (below)

## Handoff

After the user approves the output, write it to `/tmp/question.md`, then copy it to the clipboard using the first of these that exists on this machine — check with `command -v <cmd>` before running it:

```bash
# macOS
cat /tmp/question.md | pbcopy

# Windows/WSL
cat /tmp/question.md | clip.exe

# Linux, Wayland
cat /tmp/question.md | wl-copy

# Linux, X11 (requires xclip or xsel)
cat /tmp/question.md | xclip -selection clipboard
```

On success, tell the user: "Copied to clipboard — paste into [platform]."

**If no clipboard command is available** — a headless agent, a CI run, a container, a web session — say so plainly instead of claiming success:

> No clipboard available here. The formatted question is at `/tmp/question.md`, and it's in the output above to copy from.

Never report "Copied to clipboard" unless a copy command actually ran and succeeded. The clipboard is the handoff, so a silent failure loses the output the user just approved.

**Email is the exception.** The clipboard carries Markdown, but email composers want rich text. For the `email` target, tell the user to render the Markdown first and paste the *rendered* result — see [assets/email.md](./assets/email.md).

## Content Guidelines

Regardless of format, a good question includes:

- **The question, first and unlabelled**: open by asking it directly, in one line. Do not put a `Title:`, `Summary:`, or `Ask:` label in front of it — the line *is* the question, and a label just adds a word the reader has to skip. This opening line is what stops the actual question being buried at the bottom, and **every target gets it, with no exceptions** — comments and email alike. Email's subject is handed to the user as a separate line to type into the client's Subject field; it never appears inside the pasted body, where it would be a heading duplicating what the reader can already see
- **Context**: Brief background — what we're building, constraints. On a comment, this is what the *thread* does not already cover, not a restatement of the item
- **Use Cases** (if applicable): Concrete scenarios showing expected behavior
- **Problem/Edge Case**: The specific issue with code/diagrams if helpful
- **Options**: 2-4 alternatives. **Derive them yourself when the user brings none** — arriving with a problem and no alternatives is the normal case, not a reason to skip this section, and proposing the candidates is most of the value the skill adds. Give every option a concrete **cost it incurs**, not only what it gains: a list where every entry is upside has not been thought through, and gives the reader nothing to weigh
- **Questions**: Numbered list of specific questions to answer
- **Research** (if applicable): Links to relevant docs or prior art

Use ASCII diagrams in code blocks to visualize architecture, data flow, state transitions, or UI layouts — visuals communicate faster than prose.

## References

Format-specific templates with markdown rules and examples:

- [assets/slack.md](./assets/slack.md) — Slack formatting (default)
- [assets/asana.md](./assets/asana.md) — Asana task descriptions
- [assets/jira.md](./assets/jira.md) — Jira wiki markup
- [assets/github.md](./assets/github.md) — GitHub Issues/PRs
- [assets/gitlab.md](./assets/gitlab.md) — GitLab Issues/MRs
- [assets/email.md](./assets/email.md) — Plain text email
- [assets/markdown.md](./assets/markdown.md) — Markdown baseline + per-platform capability table (covers `linear`); the fallback for any unlisted platform
