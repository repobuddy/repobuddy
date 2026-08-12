---
spec-type: behavioral
concept:
  - content-composition
  - platform-rendering
  - human-handoff
---

# to-question

## What

A person has a technical question they have been chewing on — a design fork, an edge case, a "which
of these three do we do" — and they are about to paste it somewhere for other people to answer. Left
alone, that paste tends to go out as a wall of prose with the actual question buried in the last
line, and it renders wrong besides, because Slack and Jira do not accept the Markdown everyone
reflexively types.

`to-question` does two things about that. It **composes** the half-formed question into a fixed
shape — Context, Use Cases, Problem, Options, Questions — so the thing being asked is actually
visible. Then it **renders** that content in the target platform's own markup dialect, so it looks
right when pasted. It shows the result, takes revisions until the person is happy, and hands the
final text off through the clipboard.

It stops there, deliberately. It never posts.

**Key terms**

- **Composition** — turning a half-formed question into the structured sections.
- **Rendering** — expressing those sections in one platform's markup dialect.
- **Markup dialect** — the syntax a platform accepts. Slack's mrkdwn (`*bold*`) and Jira's wiki
  markup (`h2.`) are not Markdown, and Markdown pasted into them renders as literal punctuation.
- **Handoff sink** — where the finished text is left: a file at `/tmp/question.md` plus the system
  clipboard.

### Non-goals

- **Delivering the post.** No posting, filing, sending, or authenticating. A user who wants the
  thing to *exist* on a tracker is routed to `create-issue`; one who wants it researched first is
  routed to `research-workbench:community-post`. The reasoning is
  [ADR 0001](../../design/decisions/0001-to-question-owns-composition-not-delivery.md), and the
  routing rule is [posting-skill-boundaries](../../design/posting-skill-boundaries.md).
- **Duplicate checking.** `create-issue` searches for existing issues before filing because filing a
  duplicate is a real harm. Composing text carries no such risk, and this skill does not search.
- **Research.** It works from what the user brings. It does not go find prior art.
- **Content shapes other than a question.** The section template is fixed. A bug report, an RFC, a
  status update, or a code-review comment are *not* served by it today — see *Known gaps*.

### Known gaps in the shipped behavior

This spec is a backfill of PR #577, and records what the skill does, not what it should do. Three
places where the shipped instructions genuinely do not determine an outcome:

1. **Unrecognized format token.** The procedure says "determine target format from user input
   (default: `slack`)". It does not say what happens when the user names a platform that has no
   asset — `discord`, `teams`, `notion`. Falling back to `slack` silently and treating the word as
   part of the topic are both consistent with the text.
   <!-- open: what should to-question do when asked for a platform it has no asset for — refuse, fall back to the closest dialect, or fall back to slack? -->
2. **Clipboard failure.** Three copy commands are listed, one per OS, with no instruction for
   choosing between them and no branch for the case where none is available — a headless agent, a
   Linux box without `xclip`/`wl-copy`, a web session. Since the clipboard is the handoff sink, a
   silent failure here loses the whole output.
   <!-- open: what is the fallback sink when no clipboard command is available? -->
3. **Email is not clipboard-shaped.** `assets/email.md` instructs the user to render the Markdown
   and paste the *rendered* result as rich text, but the procedure copies raw Markdown to the
   clipboard. For the `email` target those two steps contradict each other.

Gaps 2 and 3 are defects rather than open questions, and are addressed on the branch; gap 1 needs a
product call and is left open.

## Use Cases

**Fit:** strong

`to-question` makes a genuine activation decision — its domain overlaps two sibling skills that use
the same vocabulary — and its composition step is judgment, not mechanism.

| # | Use case | Trigger | Inputs | Outcome |
|---|---|---|---|---|
| 1 | **Compose for the default platform** | User asks for help wording/formatting a technical question and names no platform | The question plus whatever context they gave | A Slack-mrkdwn draft, displayed for review |
| 2 | **Compose for a named platform** | User names one of the six supported platforms | The question, context, and the platform name | A draft in that platform's dialect, displayed for review |
| 3 | **Revise the draft** | User responds to a displayed draft asking for a change | The change they asked for | A revised draft, displayed again for review |
| 4 | **Hand off the approved draft** | User signals the draft is good | The approved draft | Written to `/tmp/question.md`, copied to the clipboard, and the user told which platform to paste into |

Use cases 1 and 2 enter the same composition sub-graph and differ only at the format-resolution
edge. Use cases 3 and 4 are the two exits from the review loop.

## Control Flow

### Composition and rendering (use cases 1, 2)

```mermaid
graph TD
    A[Skill invoked with a question] --> B{Is the request<br/>compose-only?}
    B -->|User asked to file/open an issue| C[Defer to create-issue]
    B -->|User asked for research-backed post| D[Defer to community-post]
    B -->|User asked for wording/formatting| E{Platform named?}
    E -->|No| F[Resolve format to slack]
    E -->|Yes, one of the six| G[Resolve format to the named platform]
    F --> H[Load assets/format.md]
    G --> H
    H --> I[Compose content into the section template]
    I --> J{Would a diagram<br/>beat prose?}
    J -->|Yes| K[Add ASCII diagram inside a fenced block]
    J -->|No| L[Prose only]
    K --> M[Render in the dialect's markup]
    L --> M
    M --> N[Display inside a 4-backtick fence]
    N --> O[Ask for changes]
```

The 4-backtick fence at display is not cosmetic: every template contains triple-backtick blocks, so
a triple-backtick wrapper would terminate at the first nested block and the rest of the draft would
render as loose text.

### Review loop (use cases 3, 4)

```mermaid
graph TD
    O[Draft displayed, changes invited] --> P{User's response}
    P -->|Asks for a change| Q[Revise the draft]
    Q --> R[Display revised draft]
    R --> O
    P -->|Approves| S[Write /tmp/question.md]
    S --> T[Copy to clipboard via the platform's command]
    T --> U[Tell the user which platform to paste into]
```

The loop has no iteration cap: it exits only on approval.

## Scenario map

### Use cases 1–2 — compose for a platform

| Edge | Path (Given) | Scenario |
|---|---|---|
| `B -->|wording/formatting| E` | user has a half-formed technical question | `` `composes when asked to word a question for posting` `` |
| `B -->|file/open an issue| C` | same repo, user says "file a bug" | `` `stays out when the user asks to file an issue` `` |
| `B -->|research-backed post| D` | user wants prior art gathered first | `` `stays out when the user asks for a researched post` `` |
| `E -->|No| F` | no platform named anywhere in the request | `` `defaults to slack when no platform is named` `` |
| `E -->|Yes| G` | user named jira | `` `renders jira wiki markup when jira is named` `` |
| `H` (asset load) | target platform is slack | `` `reads the platform asset rather than recalling its syntax` `` |
| `I` (compose) | user supplied only a problem, no options | `` `composes the section template from a half-formed question` `` |
| `J -->|Yes| K` | question is about a state machine | `` `puts an ASCII diagram inside a fenced block` `` |
| `M` (render) | target platform is slack | `` `renders slack bold as single asterisks, never double` `` |
| `N` (display) | draft contains a fenced code block | `` `wraps the displayed draft in a 4-backtick fence` `` |

### Use case 3 — revise the draft

| Edge | Path (Given) | Scenario |
|---|---|---|
| `P -->|Asks for a change| Q` | draft displayed, user wants an option dropped | `` `revises and redisplays when the user asks for a change` `` |
| `R --> O` | second draft displayed | `` `keeps inviting changes rather than handing off unprompted` `` |

### Use case 4 — hand off the approved draft

| Edge | Path (Given) | Scenario |
|---|---|---|
| `P -->|Approves| S` | user says the draft is good | `` `writes the approved draft to a file on approval` `` |
| `T` (copy) | approved draft, target platform slack | `` `copies to the clipboard and names the platform to paste into` `` |
| `S` (guard) | draft displayed, user has not approved | `` `does not copy to the clipboard before approval` `` |
