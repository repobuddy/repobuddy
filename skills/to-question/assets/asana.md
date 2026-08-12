# Asana Format

Asana supports markdown shortcuts in the UI. API uses `html_notes` field.

**Target: a comment on an existing task**, not a new task. Creating the task is `create-issue`'s job.
Write it as someone speaking into the task's activity feed — the reader already has the task's
context, so do not restate it.

## Syntax

| Format | Syntax |
|--------|--------|
| Bold | `**text**` or Cmd+B |
| Italic | `*text*` or Cmd+I |
| Strikethrough | `~~text~~` |
| Inline code | `` `code` `` |
| Code block | ` ``` ` |
| Blockquote | `> quote` |
| Heading 1 | `# Heading` |
| Heading 2 | `## Heading` |
| Bullet list | `- item` or `* item` |
| Numbered list | `1. item` |
| Link | `[title](url)` |

**Note:** `#` and `##` render as styled text (similar to bold), not true heading hierarchy.

## Template

```
Ask the question directly, in one line. No heading, no label.

# 🔎 Context

Brief background — what are we building, what constraint exists.
Use ASCII diagrams in code blocks to visualize architecture, data flow, or relationships.

# 🎯 Use Cases (if applicable)

When proposing a solution or design, show concrete scenarios:
- User does X → system responds with Y
- Edge case: when Z happens, we need to handle it by...

# ⚠️ The Problem / Edge Case

Concrete example showing the issue. Use ASCII diagrams in code blocks to illustrate
state transitions, UI layouts, or edge cases.

# 💡 Options

**Option A: Name**
- Pro/con
- Pro/con

**Option B: Name**
- Pro/con
- Pro/con

# ✋ Questions

1. Specific question to answer
2. Another question if needed

# 📚 Research (if applicable)

Links to relevant docs, articles, or prior art:
- [Title](url) — one-line summary
- [Title](url) — one-line summary
```

## Tips

- Asana renders markdown in task comments and descriptions, but not in task names
- Keep it scannable — comments are read in a busy activity feed, often on a phone
- Use subtasks for action items that come out of the discussion
- ASCII diagrams work in code blocks
