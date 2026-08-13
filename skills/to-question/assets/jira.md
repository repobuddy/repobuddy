# Jira Format

Jira uses **wiki markup**, not Markdown. Cloud API v3 uses Atlassian Document Format (ADF) JSON.

## Syntax

| Format | Syntax |
|--------|--------|
| Bold | `*bold*` |
| Italic | `_italic_` |
| Underline | `+underline+` |
| Strikethrough | `-strikethrough-` |
| Monospace | `{{code}}` |
| Heading 1 | `h1. Heading` |
| Heading 2 | `h2. Heading` |
| Bullet list | `* item` (nested: `** item`) |
| Numbered list | `# item` (nested: `## item`) |
| Link | `[Link Text\|https://url]` |
| Code block | `{code:java}code{code}` |
| Preformatted | `{noformat}text{noformat}` |
| Quote | `{quote}text{quote}` |
| Panel | `{panel:title=Title}content{panel}` |

**Tables:**
```
|| Header 1 || Header 2 ||
| Cell 1 | Cell 2 |
```

## Template

```
Ask the question directly, in one line. No heading, no label.

h2. Context

Brief background — what are we building, what constraint exists.

{noformat}
ASCII diagram here if helpful
{noformat}

h2. Use Cases (if applicable)

* User does X → system responds with Y
* Edge case: when Z happens, we need to handle it by...

h2. The Problem / Edge Case

Concrete example showing the issue.

{code:javascript}
// Code example here
{code}

h2. Options

*Option A: Name*
* What it gains
* What it costs

*Option B: Name*
* What it gains
* What it costs

h2. Questions

# Which option aligns best with our architecture?
# Should this be a dev-mode warning or silent behavior?

h2. Research (if applicable)

* [Title|url] — one-line summary
* [Title|url] — one-line summary
```

## Tips

- Jira wiki markup is NOT Markdown — `**bold**` does not work
- Nesting uses repeated characters (`**` for level 2), not indentation
- `{code:language}` supports syntax highlighting
- Use `{panel}` for important callouts
- ASCII diagrams work in `{noformat}` or `{code}` blocks
