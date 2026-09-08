# to-question

Format a technical question or discussion for a platform and copy to clipboard.

## Usage

```
/to-question [shape] [format] <topic or question>
```

## Supported Formats

| Format | Platform | Dialect | Default |
|--------|----------|---------|---------|
| `slack` | Slack | Slack mrkdwn | ✓ |
| `jira` | Jira issues | Jira wiki markup | |
| `email` | Email (rich text paste) | plain text / rich text | |
| `github` | GitHub Issues/PRs | Markdown family | |
| `gitlab` | GitLab Issues/MRs | Markdown family | |
| `linear` | Linear issues/projects | Markdown family | |
| `asana` | Asana tasks | Markdown family | |
| `markdown` | Markdown baseline — also the fallback for any unlisted *private* platform | Markdown family | |

The references under `references/` are sorted by **dialect, not by platform name**. The whole Markdown
family shares one file with a per-platform capability table (headings, tables, task lists,
strikethrough, alerts), so a new Markdown-family platform costs a row rather than another
near-duplicate file. Slack, Jira and email keep their own files because their dialects genuinely
diverge. An unlisted *private* platform — Notion, Teams — falls back to the Markdown baseline, and
the skill says so.

**Public venues are out of scope.** Stack Overflow, X/Bluesky, Reddit, Discord, Telegram and
Facebook/LinkedIn are not unlisted dialects — they are a different job. Every target above writes to
an audience that already has the context: people on the item, in your channel, or named on the mail.
A public audience has none, so the post has to restate the context, cite prior art, and not repeat a
question already answered — none of which this skill does. Ask for one of those venues and it points
you at `research-workbench:community-post`, which researches first.

## Supported Shapes

The shape decides which sections the draft has; the format decides the markup it is rendered in.
They are chosen independently.

| Shape | Use when | Sections | Default |
|-------|----------|----------|---------|
| `question` | You are undecided between alternatives and want input | Context → Use Cases → Problem → Options → Questions | ✓ |
| `unblock` | You are stuck and need a named person to do a named thing | Blocked on → Already tried → **What I need from you** → By when | |

`question` is the default, so nothing changes unless you ask for `unblock` — or say you are blocked,
stuck, or waiting on someone, in which case the skill picks `unblock` and tells you it did.

## Checking the markup yourself

The skill runs this before showing you a draft, and you can run it on anything:

```bash
# paths are relative to this skill's directory, not your cwd
node ./scripts/check-format.mjs <target> draft.md          # readable
node ./scripts/check-format.mjs <target> draft.md --json    # parseable
```

It flags markup that will not survive the paste — Markdown bold in Slack, `##` headings in Jira,
headings past `####` in Linear, a subject line inside an email body — and skips fenced blocks, so
diagrams and code samples are never flagged. Exit code 0 means clean.

## What it does

1. Takes your question/topic and structures it into the chosen shape for the target platform
2. Formats using platform-specific syntax (mrkdwn, wiki markup, GFM, etc.)
3. Iterates with you until you're happy with the output
4. Copies the result to your clipboard — or, where no clipboard is available, leaves it in a private temp file and tells you the path

It formats for you to paste. It never posts, files, or sends anything — to file an issue, use `create-issue`; to post somewhere public, use `research-workbench:community-post`.

## Output structure

### `question` (default)

- **The question**: asked directly in the opening line, unlabelled
- **Context**: Brief background with ASCII diagrams if helpful
- **Use Cases**: Concrete scenarios (if applicable)
- **Problem/Edge Case**: The specific issue with code examples
- **Options**: 2-4 alternatives with tradeoffs
- **Questions**: Numbered list of specific questions to answer
- **Research**: Links to relevant docs (if applicable)

### `unblock`

- **The ask**: what is blocked and what you need, in the opening line
- **Blocked on**: the specific thing in the way, with the exact error if there is one
- **Already tried**: each attempt and what it produced
- **What I need from you**: a named person or team, plus one concrete action
- **By when**: a date, and what slips if it is missed
- **Link**: the PR, ticket, branch, or failing run (if applicable)
