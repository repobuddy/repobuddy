# GitLab Format

GitLab uses **GitLab Flavored Markdown (GLFM)**, based on GFM with extensions.

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
| Table of contents | `[[_TOC_]]` |

## Template

````markdown
Ask the question directly, in one line. No heading, no label.

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

- Nearly identical to GitHub markdown
- `@mentions` notify users; `#123` links to issues, `!123` links to MRs
- Quick actions in descriptions: `/assign @user`, `/label ~bug`
- `<details><summary>` for collapsible sections
- Math with `$inline$` and `$$block$$`
- Mermaid and PlantUML diagrams supported
