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

## Subject line — typed into the client, not pasted

The subject goes in the mail client's own **Subject field**. Give it to the user as a separate line
to type there; it is **not** part of the body and must not appear inside the pasted text, where it
would render as a heading and duplicate the field the reader can already see.

Make it searchable: `[Question] <the question, shortened>` or `[RFC] <topic>`.

## Template

The body below is what gets rendered and pasted. Like every other target, it opens by asking the
question directly — no heading, no label.

````markdown
Ask the question directly, in one line. No heading, no label.

## Context

Brief background — what are we building, what constraint exists.

## The Problem

Concrete example showing the issue.

```
// Code example (keep short)
```

## Options

**Option A: Name**
- What it gains
- What it costs

**Option B: Name**
- What it gains
- What it costs

## Questions

1. Which option aligns best with our architecture?
2. Should this be a dev-mode warning or silent behavior?

## Research (if applicable)

- [Title](url) — one-line summary
- [Title](url) — one-line summary
````

## Tips

- Write markdown → render → copy rendered → paste into email
- Gmail preserves most formatting; Outlook may strip some
- Code blocks may not paste well — keep them short or use inline code
- Give the subject as a separate line to type into the Subject field — never inside the pasted body
- Put the most important question at the top
- Consider who needs To: vs CC:
