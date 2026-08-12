# Email Format

Email clients (Gmail, Outlook) support **rich text when pasting** from rendered markdown. Write in markdown, render it (e.g., in a markdown preview), then paste.

## Approach

1. Write content in standard markdown
2. Render/preview the markdown (browser, VS Code preview, etc.)
3. Copy the rendered output and paste into email composer
4. Gmail/Outlook will preserve headings, bold, lists, links, code formatting

## Syntax (write as markdown, paste as rich text)

| Format | Syntax |
|--------|--------|
| Bold | `**text**` |
| Italic | `*text*` |
| Headings | `#`, `##`, `###` |
| Bullet list | `- item` |
| Numbered list | `1. item` |
| Link | `[text](url)` |
| Inline code | `` `code` `` |
| Code block | ` ``` ` (may lose formatting — keep short) |

## Template

```markdown
# Subject: [Question] Clear statement of the question

## Context

Brief background — what are we building, what constraint exists.

## The Problem

Concrete example showing the issue.

```
// Code example (keep short)
```

## Options

**Option A: Name**
- Pro/con
- Pro/con

**Option B: Name**
- Pro/con
- Pro/con

## Questions

1. Which option aligns best with our architecture?
2. Should this be a dev-mode warning or silent behavior?

## Research (if applicable)

- [Title](url) — one-line summary
- [Title](url) — one-line summary
```

## Tips

- Write markdown → render → copy rendered → paste into email
- Gmail preserves most formatting; Outlook may strip some
- Code blocks may not paste well — keep them short or use inline code
- Subject line should be searchable: `[Question] Topic` or `[RFC] Topic`
- Put the most important question at the top
- Consider who needs To: vs CC:
