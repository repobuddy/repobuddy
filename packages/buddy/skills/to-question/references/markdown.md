# Markdown Family

One reference for every Markdown-family target, plus the **fallback dialect** for platforms this
skill has never been pointed at.

Use this when:

- the target is a Markdown-family platform — `github`, `gitlab`, `asana`, `linear`, `markdown` — or
- the target is `bugzilla` **and the user has said the instance renders Markdown** (it does not by
  default; see [plaintext.md](./plaintext.md) for the default and the mode question), or
- the user names a platform this skill has no dialect reference for (`discord`, `notion`, `teams`,
  `reddit`, …).

Platforms are sorted here by **dialect, not by name**. GitHub, GitLab, Asana and Linear all speak
Markdown; what separates them is *which* features render, and that is a row in the capability table
below rather than a file of its own. A new Markdown-family platform costs a row.

**When falling back, say so.** Tell the user which dialect you used and what to double-check:

> I don't have a dialect reference for Notion, so I've used the Markdown baseline — worth checking that headings and tables render the way you want.

Never fall back silently. A draft that renders as literal punctuation is worse than one the user was
warned about. A supported target that happens to be served by this file — `linear`, say — is normal
routing, **not** a fallback: do not announce it as one.

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

Stay inside this subset unless the capability table says the target supports more.

## Capability table

Only rows checked against the platform's own documentation are marked. **Unverified** means treat it
as the baseline above and tell the user you did.

| Platform | Headings | Tables | Task lists | Strikethrough | Alerts / callouts | Code blocks |
|---|---|---|---|---|---|---|
| `github` | `#`–`######` | yes | yes | `~~text~~` | `> [!NOTE]` / `> [!WARNING]` | yes, 700+ languages |
| `gitlab` | `#`–`######` | yes | yes | `~~text~~` | no — use a blockquote | yes |
| `linear` | `#`–`####` **(4 max)** | yes | yes | `~~text~~` | no — `>>>` collapsible instead | yes, highlighting undocumented |
| `asana` | `#` / `##` render as **styled text**, not real headings | **no** | **no** | `~~text~~` | no | yes |
| `bugzilla` (Markdown mode only) | `#`–`######` | yes | yes | `~~text~~` | no | yes, fenced |
| anything else | unverified | unverified | unverified | unverified | unverified | unverified |

Where a cell says no, drop to the baseline for that one feature — a table that does not render is
worse than a bullet list that does.

## Platform notes

Only the quirks that change what you write. Everything else is the baseline.

**`github`** — target is a **comment on an existing issue or PR**. `@mentions` notify users, `#123`
links to issues and PRs, `<details><summary>` gives collapsible sections, math is `$inline$` and
`$$block$$`, and ` ```mermaid ` blocks render as diagrams.

**`gitlab`** — target is a **comment on an existing issue or MR**. Near-identical to GitHub;
`@mentions` notify, `#123` links to issues and `!123` to MRs, `[[_TOC_]]` inserts a table of
contents, `<details><summary>` collapses, math is `$inline$`/`$$block$$`, and both Mermaid and
PlantUML render. Quick actions (`/assign @user`, `/label ~bug`) belong in the item, not in a
question — do not emit them.

**`linear`** — target is a **comment on an existing issue**. Headings stop at `####`; `#####` will
not render. `>>>` opens a collapsible section, `@` mentions users, issues and projects, ` ```mermaid `
blocks render, and `:emoji:` shortcodes expand.

**`asana`** — target is a **comment on an existing task**, in a busy activity feed often read on a
phone, so keep it scannable. `#` and `##` render as styled text rather than a real heading
hierarchy, and there is no third level: use `#` for sections and **bold** for option names instead of
`###`. Emoji section markers (`# 🔎 Context`, `# 💡 Options`) are the house convention and make the
comment skimmable. Tables and task lists do not render — use bullet lists. Markdown works in
comments and descriptions but **not** in task names, and follow-up action items belong in subtasks
rather than in the comment.

**`bugzilla`** — target is a **comment on an existing bug**, and this row applies **only when the
user has confirmed Markdown mode**: Bugzilla's default is plain text, chosen per user preference and
per comment, so the skill assumes [plaintext.md](./plaintext.md) unless told otherwise. In Markdown
mode it is GFM **minus inline images and minus inline HTML** — both are stripped, so a
`<details><summary>` block and an `![alt](url)` image are lost rather than rendered. Bugzilla's own
auto-linkification survives either mode: bare URLs, `bug 12345`, `comment 5` and `attachment 7`
become links on their own and need no `[text](url)` wrapping.

**Not in this family:** Slack ([slack.md](./slack.md)) uses mrkdwn and Jira ([jira.md](./jira.md))
uses wiki markup. Markdown does not work in either — never fall back to this file for them. Email
([email.md](./email.md)) is composed as Markdown but pasted as rich text. Redmine
([textile.md](./textile.md)) and Trac ([trac.md](./trac.md)) each have their own non-Markdown
dialect, and Bugzilla ([plaintext.md](./plaintext.md)) accepts no markup at all by default.

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

On `asana`, run the same sections through its constraints: `#` headings with emoji markers, **bold**
option names in place of `###`, and bullet lists wherever the template would have used a table.

## Tips

- Keep to the baseline syntax unless the capability table says otherwise
- ASCII diagrams belong in code blocks so they keep a monospace font
- Cap headings at `####` on `linear`; use `#`/`##` plus bold on `asana`
- When you fall back to this file for an unlisted platform, name the assumption in your reply
- On `bugzilla`, drop inline images and inline HTML, and only use this file once Markdown mode is confirmed
