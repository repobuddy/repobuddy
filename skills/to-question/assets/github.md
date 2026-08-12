# GitHub Format

GitHub uses **GitHub Flavored Markdown (GFM)**, a superset of CommonMark.

## Syntax

| Format | Syntax |
|--------|--------|
| Bold | `**text**` |
| Italic | `*text*` or `_text_` |
| Strikethrough | `~~text~~` |
| Inline code | `` `code` `` |
| Code block | ` ```language ` |
| Headings | `#` through `######` |
| Link | `[text](url)` |
| Image | `![alt](url)` |
| Bullet list | `- item` or `* item` |
| Numbered list | `1. item` |
| Task list | `- [ ] unchecked` / `- [x] checked` |
| Blockquote | `> quote` |
| Table | Pipe syntax with `---` separator |

**Alerts:**
```markdown
> [!NOTE]
> Useful information

> [!WARNING]
> Urgent info
```

## Template

````markdown
## Summary
(the question's own one-line headline — not the item's title; keep it on comments too)

One-line summary of the question or proposal.

## Context

Brief background — what are we building, what constraint exists.

```
ASCII diagram here if helpful
```

## Use Cases (if applicable)

- User does X → system responds with Y
- Edge case: when Z happens, we need to handle it by...

## The Problem / Edge Case

Concrete example showing the issue.

```tsx
// Code example here
```

## Options

### Option A: Name
- Pro/con
- Pro/con

### Option B: Name
- Pro/con
- Pro/con

## Questions

1. Which option aligns best with our architecture?
2. Should this be a dev-mode warning or silent behavior?

## Research (if applicable)

- [Title](url) — one-line summary
- [Title](url) — one-line summary
````

## Tips

- Full GFM support — use headings, tables, task lists freely
- Syntax highlighting for 700+ languages
- `@mentions` notify users; `#123` links to issues/PRs
- `<details><summary>` for collapsible sections
- Math with `$inline$` and `$$block$$`
- Mermaid diagrams in ` ```mermaid ` blocks
