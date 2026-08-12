---
name: to-question
description: Format a technical question or discussion for a platform (slack, asana, jira, github, gitlab, email). Copies to clipboard.
---

# Question Formatter

Format a technical question, design discussion, or decision request for posting to a platform.

## Supported Formats

| Format | Platform | Default |
|--------|----------|---------|
| `slack` | Slack | ✓ |
| `asana` | Asana tasks |  |
| `jira` | Jira issues |  |
| `github` | GitHub Issues/PRs |  |
| `gitlab` | GitLab Issues/MRs |  |
| `email` | Plain text email |  |

## Procedure

1. Determine target format from user input (default: `slack`)
2. Load the format template from `assets/<format>.md`
3. Take the user's question/topic and any context they provide
4. Structure using the template's pattern and markdown rules
5. Display the formatted output in the reply (inside a fenced code block with 4 backticks so nested triple-backticks render correctly)
6. Ask if the user wants any changes — iterate until they're happy
7. Once approved, write to `/tmp/question.md` and copy to clipboard

## Clipboard Command

After the user approves the output, copy to clipboard:

```bash
# macOS
cat /tmp/question.md | pbcopy

# Linux (requires xclip or xsel)
cat /tmp/question.md | xclip -selection clipboard

# Windows/WSL
cat /tmp/question.md | clip.exe
```

Then tell the user: "Copied to clipboard — paste into [platform]."

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
