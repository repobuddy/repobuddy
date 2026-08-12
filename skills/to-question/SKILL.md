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

**The tracker targets produce a comment on an item that already exists — not a new task, issue, or ticket.** That distinction is the whole boundary with `create-issue`: if the user wants the item to *exist*, that is `create-issue`'s job, and it searches for duplicates first. This skill words what you say *on* an item. So drop title/summary lines that only make sense on a new item, and write the opening so it reads as someone speaking into an existing thread.

## Procedure

1. Determine target format from user input (default: `slack`)
2. Load the format template from `assets/<format>.md`. **If the user named a platform with no file of its own** — `discord`, `notion`, `teams`, `reddit`, anything unlisted — load [assets/markdown.md](./assets/markdown.md) and tell the user you fell back to the Markdown baseline. Never fall back silently, and never fall back to Markdown for Slack or Jira, which do not accept it
3. Take the user's question/topic and any context they provide
4. Structure using the template's pattern and markdown rules
5. Display the formatted output in the reply (inside a fenced code block with 4 backticks so nested triple-backticks render correctly)
6. Ask if the user wants any changes — iterate until they're happy
7. Once approved, write to `/tmp/question.md` and hand off (below)

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

- **Title**: Clear statement of the question
- **Context**: Brief background — what we're building, constraints
- **Use Cases** (if applicable): Concrete scenarios showing expected behavior
- **Problem/Edge Case**: The specific issue with code/diagrams if helpful
- **Options**: 2-4 alternatives with tradeoffs (bullet points)
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
