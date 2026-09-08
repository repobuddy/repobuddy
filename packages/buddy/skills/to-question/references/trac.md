# Trac Wiki Markup

Trac has one fixed dialect and no Markdown mode, which makes it the simplest of the non-Markdown
trackers: there is no mode to assume and nothing to announce. It is also nothing like Markdown —
bold is `'''three quotes'''`, headings are `= wrapped in equals =`, and a list item only becomes a
list if the line starts with a space.

Use this when the target is `trac`.

## Syntax

| Format | Syntax |
|--------|--------|
| Bold | `'''bold'''` |
| Italic | `''italic''` |
| Bold italic | `'''''both'''''` |
| Underline | `__underline__` |
| Inline monospace | `` `code` `` or `{{{code}}}` |
| Heading 1 | `= Heading =` |
| Heading 2 | `== Heading ==` |
| Bullet list | ` * item` — **the leading space is required** (nested: more spaces) |
| Numbered list | ` 1. item` (also ` a.`) |
| Link | `[https://url Link Text]` — URL first, label after a space |
| Wiki link | `[wiki:PageName label]` or `[[PageName]]` |
| Code block | `{{{` … `}}}`, first line `#!python` for highlighting |
| Quote | `> quoted line`, or indent the block |
| Horizontal rule | `----` |

**Tables** — every cell is wrapped in double pipes, and the header row uses `=`:

```
||= Header 1 =||= Header 2 =||
|| Cell 1 || Cell 2 ||
```

**Trac's own auto-links** — `#123` links to a ticket, `r123` to a changeset, `[123]` also to a
changeset, `{1}` to a report. `#123` needs no wrapping; be aware that a bare `[123]` in prose becomes
a changeset link.

## Template

````
Ask the question directly, in one line. No heading, no label.

== Context ==

Brief background — what are we building, what constraint exists.

{{{
ASCII diagram here if helpful
}}}

== Use Cases (if applicable) ==

 * User does X → system responds with Y
 * Edge case: when Z happens, we need to handle it by...

== The Problem / Edge Case ==

Concrete example showing the issue.

{{{
#!javascript
// Code example here
}}}

== Options ==

'''Option A: Name'''
 * What it gains
 * What it costs

'''Option B: Name'''
 * What it gains
 * What it costs

== Questions ==

 1. Which option aligns best with our architecture?
 2. Should this be a dev-mode warning or silent behaviour?

== Research (if applicable) ==

 * [https://url Title] — one-line summary
 * [https://url Title] — one-line summary
````

## Tips

- Trac wiki markup is NOT Markdown — `**bold**`, `## Heading` and `[text](url)` all render literally
- A list item with no leading space is a paragraph; this is the mistake to check for first
- Link syntax is reversed from Markdown: the URL comes first, the label second, one space between
- Tables need `||` on both sides of every cell, including the outer edges
- ASCII diagrams and code go in `{{{ }}}` blocks, which keep a monospace font
- `----` on its own line is a horizontal rule; four hyphens in prose will surprise you
