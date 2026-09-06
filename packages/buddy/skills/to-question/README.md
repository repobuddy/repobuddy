# to-question

Format a technical question or discussion for a platform and copy to clipboard.

## Usage

```
/to-question [format] <topic or question>
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
| `markdown` | Markdown baseline — also the fallback for anything unlisted | Markdown family | |

The references under `assets/` are sorted by **dialect, not by platform name**. The whole Markdown
family shares one file with a per-platform capability table (headings, tables, task lists,
strikethrough, alerts), so a new Markdown-family platform costs a row rather than another
near-duplicate file. Slack, Jira and email keep their own files because their dialects genuinely
diverge. A platform nobody has verified falls back to the Markdown baseline, and the skill says so.

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

1. Takes your question/topic and structures it for the target platform
2. Formats using platform-specific syntax (mrkdwn, wiki markup, GFM, etc.)
3. Iterates with you until you're happy with the output
4. Copies the result to your clipboard — or, where no clipboard is available, leaves it in a private temp file and tells you the path

It formats for you to paste. It never posts, files, or sends anything — to file an issue, use `create-issue`.

## Output structure

- **The question**: asked directly in the opening line, unlabelled
- **Context**: Brief background with ASCII diagrams if helpful
- **Use Cases**: Concrete scenarios (if applicable)
- **Problem/Edge Case**: The specific issue with code examples
- **Options**: 2-4 alternatives with tradeoffs
- **Questions**: Numbered list of specific questions to answer
- **Research**: Links to relevant docs (if applicable)
