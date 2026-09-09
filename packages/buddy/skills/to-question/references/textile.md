# Textile (Redmine)

Redmine's default markup is **Textile**, not Markdown. `**bold**` renders as literal asterisks and
`## Context` as literal hashes — worse, `#` at the start of a line is Textile's *ordered list*
marker, so a Markdown heading pasted into Redmine becomes a numbered item.

Use this when the target is `redmine` and the instance is in its **Textile mode**.

## The mode problem

Redmine's markup is an **instance-wide admin setting** (`text_formatting`), not a property of the
platform: an administrator picks Textile or CommonMark once, for everybody. Nothing in the URL or in
the user's phrasing reveals which, and unlike Bugzilla there is no per-comment escape hatch — if the
instance is on CommonMark, Textile is simply wrong there, and the reverse.

**Default to Textile and say so.** It is the long-standing Redmine default and still the mode most
deployed instances are in. Say which mode was assumed, in one line at the end of the reply:

> Formatted as Textile, Redmine's default. Redmine 6 ships CommonMark as the default for new
> installations, so if your instance is on Markdown, say the word and I'll redo it.

If the user says the instance is on CommonMark, use [markdown.md](./markdown.md) — Redmine's
CommonMark is close to the baseline; treat the capability table's `anything else` row as unverified
and tell the user so.

## Syntax

| Format | Syntax |
|--------|--------|
| Bold | `*bold*` |
| Italic | `_italic_` |
| Underline | `+underline+` |
| Strikethrough | `-strikethrough-` |
| Inline code | `@code@` |
| Heading 1 | `h1. Heading` |
| Heading 2 | `h2. Heading` |
| Bullet list | `* item` (nested: `** item`) |
| Numbered list | `# item` (nested: `## item`) |
| Link | `"Link Text":https://url` |
| Code block | `<pre><code class="ruby">code</code></pre>` |
| Preformatted | `<pre>text</pre>` |
| Quote | `bq. text`, or `> text` |

**Tables** — the header row's cells are prefixed `_.`:

```
|_. Header 1 |_. Header 2 |
| Cell 1 | Cell 2 |
```

**Redmine's own auto-links** — `#123` links to an issue, `r123` to a revision, `commit:hash` to a
commit, `source:path/to/file` to a repository file. They are not markup and need no wrapping.

## Template

````
Ask the question directly, in one line. No heading, no label.

h2. Context

Brief background — what are we building, what constraint exists.

<pre>
ASCII diagram here if helpful
</pre>

h2. Use Cases (if applicable)

* User does X → system responds with Y
* Edge case: when Z happens, we need to handle it by...

h2. The Problem / Edge Case

Concrete example showing the issue.

<pre><code class="javascript">
// Code example here
</code></pre>

h2. Options

*Option A: Name*

* What it gains
* What it costs

*Option B: Name*

* What it gains
* What it costs

h2. Questions

# Which option aligns best with our architecture?
# Should this be a dev-mode warning or silent behaviour?

h2. Research (if applicable)

* "Title":https://url — one-line summary
* "Title":https://url — one-line summary
````

## Tips

- Textile is NOT Markdown — `**bold**` does not work, and `[text](url)` shows both halves as text
- `#` at line start is a numbered list, not a heading; headings are `h2.`
- Nesting repeats the marker (`**` for a second-level bullet), it does not indent
- ASCII diagrams go in `<pre>` blocks, which is also where they keep a monospace font
- Say the mode you assumed, every time
