# Slack Format

Slack uses **mrkdwn** (proprietary syntax), not standard Markdown.

## Syntax

| Format | Syntax | Notes |
|--------|--------|-------|
| Bold | `*text*` | Single asterisks (NOT `**text**`) |
| Italic | `_text_` | Single underscores |
| Strikethrough | `~text~` | Single tilde (NOT `~~text~~`) |
| Inline code | `` `code` `` | Same as Markdown |
| Code block | ` ``` ` | No syntax highlighting |
| Blockquote | `>text` | Same as Markdown |
| Link | `<https://url\|Link Text>` | Angle brackets + pipe |

**Not supported:** Headings (`#`), images, tables, bullet lists in mrkdwn strings

## Template

```
*Title: Clear statement of the question*

🔎 *Context*

Brief background — what are we building, what constraint exists.
Use ASCII diagrams in code blocks to visualize architecture, data flow, or relationships.

🎯 *Use Cases* (if applicable)

When proposing a solution or design, show concrete scenarios:
• User does X → system responds with Y
• Edge case: when Z happens, we need to handle it by...

⚠️ *The Problem / Edge Case*

Concrete example showing the issue. Use ASCII diagrams in code blocks to illustrate
state transitions, UI layouts, or edge cases — visuals often communicate faster than prose.

💡 *Options*

*Option A: Name*
• Pro/con
• Pro/con

*Option B: Name*
• Pro/con
• Pro/con

✋ *Questions*
1. Specific question to answer
2. Another question if needed

📚 *Research* (if applicable)

Links to relevant docs, articles, or prior art:
• <url|Title> — one-line summary
• <url|Title> — one-line summary
```

## Tips

- Use `•` (bullet character) for lists — `-` works in composer but not mrkdwn
- Emoji + bold (`🔎 *Context*`) for section headers since `#` headings don't exist
- Keep code blocks short — Slack collapses long blocks
- ASCII diagrams must be in code blocks (proportional font otherwise)
