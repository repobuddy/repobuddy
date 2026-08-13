# Markdown Baseline

The **fallback dialect**, and the reference for Markdown-family platforms that have no file of their own.

Use this when:

- the target is a Markdown-family platform listed below (e.g. `linear`), or
- the user names a platform this skill has no dialect reference for (`discord`, `notion`, `teams`, `reddit`, …).

**When falling back, say so.** Tell the user which dialect you used and what to double-check:

> I don't have a dialect reference for Notion, so I've used the Markdown baseline — worth checking that headings and tables render the way you want.

Never fall back silently. A draft that renders as literal punctuation is worse than one the user was warned about.

## Baseline syntax

The subset that works essentially everywhere in the Markdown family:

| Format | Syntax |
|--------|--------|
| Bold | `**text**` |
| Italic | `_text_` |
| Strikethrough | `~~text~~` |
| Inline code | `` `code` `` |
| Code block | ` ``` ` |
| Headings | `#` through `####` |
| Bullet list | `- item` |
| Numbered list | `1. item` |
| Task list | `- [ ]` / `- [x]` |
| Blockquote | `> quote` |
| Link | `[text](url)` |
| Table | Pipe syntax with `---` separator |

Stay inside this subset unless the capability table below says the target supports more.

## Capability table

Only rows that have been checked against the platform's own documentation are marked. **Unverified**
means treat it as the baseline above and tell the user you did.

| Platform | Headings | Tables | Task lists | Code blocks | Notes |
|---|---|---|---|---|---|
| `linear` | `#`–`####` **(4 max)** | yes | yes | yes, highlighting undocumented | Target is a **comment on an existing issue**. `>>>` collapsible sections; `@` mentions users/issues/projects; ` ```mermaid ` diagrams; `:emoji:` |
| `github` | `#`–`######` | yes | yes | yes, 700+ languages | Has its own file — [github.md](./github.md) |
| `gitlab` | `#`–`######` | yes | yes | yes | Has its own file — [gitlab.md](./gitlab.md) |
| `asana` | render as styled text, not real headings | no | no | yes | Has its own file — [asana.md](./asana.md) |
| anything else | unverified | unverified | unverified | unverified | Use the baseline and say so |

Platforms with their own file above are listed for comparison only — prefer the dedicated file when
one exists, since it carries the platform's quirks.

**Not in this family:** Slack ([slack.md](./slack.md)) uses mrkdwn and Jira ([jira.md](./jira.md))
uses wiki markup. Markdown does not work in either — never fall back to this file for them.

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

```ts
// Code example here
```

## Options

### Option A: Name
- What it gains
- What it costs

### Option B: Name
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

- Keep to the baseline syntax unless the capability table says otherwise — a table that does not render is worse than a bullet list that does
- ASCII diagrams belong in code blocks so they keep a monospace font
- On `linear`, cap headings at `####`; `#####` will not render
- When you fall back to this file for an unlisted platform, name the assumption in your reply
