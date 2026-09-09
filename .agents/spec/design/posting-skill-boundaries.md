# Posting-skill boundaries

This repo ships three skills that all turn a half-formed thought into text destined for other
people. A skill repo shipping three overlapping posting skills would be a defect, so the boundary is
stated here once, and the capability nodes enact it.

## They partition on delivery, not on content

The tempting read is that they overlap because all three produce structured prose. They do not. The
line that actually separates them is **who puts the text where it is going**.

| Skill | Composes | Delivers | Trigger shape |
|---|---|---|---|
| `to-question` | yes — a fixed section template | **no** — stops at the clipboard | "help me word this so I can post it" (as a *comment*) |
| `create-issue` | yes — a bug/feature-request shape | **yes** — `gh` / `glab` creates the issue | "file a bug", "open an issue" |
| `research-workbench:community-post` | yes — after running `deep-research` | **yes** — files to the chosen venue | "research this and post it" |

`to-question` is the only one that never touches the network. That is not an omission; it is the
capability. Its platform list is the proof — **Slack, Jira, and email are venues an agent generally
cannot post to**: a Slack DM, a Jira instance behind SSO, a mail client the agent has no session
with. When a human is the delivery mechanism, the useful thing an agent can do is hand them text
that will render correctly when pasted.

## The sharper line: new item vs. comment on an existing one

The apparent overlap is that `to-question` accepts `github`, `gitlab`, `jira`, `linear`, `asana`,
`bugzilla`, `redmine` and `trac` as targets, and `create-issue` also works against trackers. It dissolves once you say what the
composed text actually *is* on a tracker:

- **`create-issue` creates an item that does not exist yet** — an issue, a bug, a feature request.
- **`to-question` writes a comment on an item that already exists** (or a Slack message, or an
  email). It never opens anything.

So the two never contend for the same act. They are not two ways to reach a tracker; they are the
*create* path and the *comment* path, and only one of them can be what the user meant.

This is also why only `create-issue` needs a **dedup search**: creating a duplicate item is a real
harm, and commenting on an item the user is already looking at cannot duplicate anything.

The verb usually names it outright — "file/open/create an issue" is `create-issue`; "help me word
this" is `to-question`. Where the verb is ambiguous, ask whether the thing being written *needs an
item to exist first*. If it does, it is a comment.

`community-post` separates on a third axis: it is the only one that **researches first**, and it
posts to public venues (discussions, Discord, Reddit) rather than commenting on tracked work. A
request with no research obligation is not a `community-post` request, however public the venue.

## Public venues are `community-post`'s, not `to-question`'s

The delivery line above answers "who puts the text where it is going". It does **not** answer "which
skill owns a public venue", because on public venues delivery stops discriminating: `community-post`
files to GitHub and Asana through an API, but for Discord, Reddit and X it drafts the body and leaves
the human to paste it — the same handoff `to-question` uses everywhere. Two skills whose outputs are
both pasted by hand cannot be told apart by who does the pasting.

What separates them there is **whether the audience already has the context**:

| Audience | Example venues | Skill |
|---|---|---|
| Already on the item, in the channel, or named on the mail | Jira, Linear, Asana, GitHub, GitLab, Bugzilla, Redmine and Trac comments; Slack; email | `to-question` |
| Has no prior context and did not ask | Stack Overflow, X/Bluesky, Reddit, Discord, Telegram, Facebook/LinkedIn | `community-post` |

Every `to-question` target is a private or semi-private audience that is already looking at the
thing. That is not an accident of which platforms got implemented first — it is what the composition
assumes. The template opens by asking the question directly *because* the reader already knows what
it is about, and Context is explicitly "what the thread does not already cover". Point that at
strangers and the composed text is missing the half a stranger needs.

Adding public venues to `to-question` was considered in full and rejected
([#582](https://github.com/repobuddy/repobuddy/issues/582)). Two reasons, both structural rather
than a matter of unwritten dialects:

- **The section shape is the wrong shape.** `to-question` composes a *decision request* — a design
  fork, an edge case, "which of these three do we do" — and Options is the section carrying most of
  its value. Public Q&A venues close exactly that shape: on Stack Overflow it is opinion-based or too
  broad. The subset of public questions `to-question` could serve well is the subset where its
  headline section has to be suppressed.
- **Public venues impose the two obligations this skill declines.** Posting cold to a public venue
  requires searching for an existing answer and citing prior art. Both are named non-goals here:
  `to-question` does not dedup and does not research. Bolting them on would not extend the skill; it
  would rebuild `community-post` inside it, worse.

So a public venue is **not a fallback case**. An unlisted *private* venue — Notion, Teams — is a
genuine unknown dialect, and falling back to the Markdown baseline with a warning is the right
answer. An unlisted *public* venue is a known wrong answer, and the skill routes it to
`community-post` instead of composing something the venue will reject.

Short-form feeds fail a second test besides. X and Bluesky were also examined as markup dialects and
cut ([#579](https://github.com/repobuddy/repobuddy/issues/579)): they accept no markup at all and cap
at 280/300 characters, so the section template cannot fit regardless of who owns them.

## Consequence for the suites

Each of these three is a near-miss for the others: same domain, same keywords, different intent. The
`to-question` suite therefore carries near-miss scenarios drawn from *this table*, not invented ones —
they are the cases where the skill must stay out of the way.
