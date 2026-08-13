# to-question

Format a technical question or discussion for a platform and copy to clipboard.

## Usage

```
/to-question [format] <topic or question>
```

## Supported Formats

| Format | Platform | Default |
|--------|----------|---------|
| `slack` | Slack | ✓ |
| `asana` | Asana tasks | |
| `jira` | Jira issues | |
| `github` | GitHub Issues/PRs | |
| `gitlab` | GitLab Issues/MRs | |
| `linear` | Linear issues/projects | |
| `email` | Email (rich text paste) | |
| `markdown` | Markdown baseline — also the fallback for anything unlisted | |

## Checking the markup yourself

The skill runs this before showing you a draft, and you can run it on anything:

```bash
node scripts/check-format.mjs <target> draft.md          # readable
node scripts/check-format.mjs <target> draft.md --json    # parseable
```

It flags markup that will not survive the paste — Markdown bold in Slack, `##` headings in Jira,
headings past `####` in Linear, a subject line inside an email body — and skips fenced blocks, so
diagrams and code samples are never flagged. Exit code 0 means clean.

## What it does

1. Takes your question/topic and structures it for the target platform
2. Formats using platform-specific syntax (mrkdwn, wiki markup, GFM, etc.)
3. Iterates with you until you're happy with the output
4. Copies the result to your clipboard — or, where no clipboard is available, leaves it at `/tmp/question.md` and says so

It formats for you to paste. It never posts, files, or sends anything — to file an issue, use `create-issue`.

## Output structure

- **The question**: asked directly in the opening line, unlabelled
- **Context**: Brief background with ASCII diagrams if helpful
- **Use Cases**: Concrete scenarios (if applicable)
- **Problem/Edge Case**: The specific issue with code examples
- **Options**: 2-4 alternatives with tradeoffs
- **Questions**: Numbered list of specific questions to answer
- **Research**: Links to relevant docs (if applicable)
