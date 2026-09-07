# Shape: question (default)

Use when the person is **undecided between alternatives and wants input** — a design fork, an edge
case, a "which of these three do we do". This is the shape the skill has always composed, and it
stays the default.

## Sections

| Section | Carries | Required |
|---|---|---|
| _(opening line)_ | The question, asked directly in one line, with no `Title:`/`Summary:`/`Ask:` label | yes |
| Context | What we're building and what constrains it — on a comment, only what the thread does not already cover | yes |
| Use Cases | Concrete scenarios showing expected behavior | if applicable |
| Problem / Edge Case | The specific issue, with code or an ASCII diagram if that reads faster | yes |
| Options | 2–4 alternatives, each naming a concrete **cost it incurs**, not only what it gains | yes |
| Questions | Numbered, each answerable by picking from a stated set | yes |
| Research | Links to relevant docs or prior art | if applicable |

## Rules

- **Derive the options yourself when the user brings none.** Arriving with a problem and no
  alternatives is the normal case, not a reason to drop the section — proposing the candidates is
  most of the value this shape adds.
- A list where every entry is upside has not been thought through. Every option names its cost.
- If the user is **not** choosing between alternatives — they are stuck and need a named person to
  do a named thing — this is the wrong shape. Use [shape-unblock.md](./shape-unblock.md) rather than
  manufacturing an Options section that has no options in it.

## Rendering

Each dialect file beside this one carries the shape already rendered in its own markup — the
`## Template` block in [markdown.md](./markdown.md), [slack.md](./slack.md), [jira.md](./jira.md)
and [email.md](./email.md), one per dialect family. Load the target's dialect file and follow its
template.
