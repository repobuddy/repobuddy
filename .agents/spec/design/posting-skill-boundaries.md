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

The apparent overlap is that `to-question` accepts `github`, `gitlab`, `jira`, `linear` and `asana`
as targets, and `create-issue` also works against trackers. It dissolves once you say what the
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
files to public venues (discussions, Discord, Reddit) rather than commenting on tracked work.

`community-post` separates on a different axis again — it is the only one that *researches first*.
A request with no research obligation is not a `community-post` request, however public the venue.

## Consequence for the suites

Each of these three is a near-miss for the others: same domain, same keywords, different intent. The
`to-question` suite therefore carries near-miss scenarios drawn from *this table*, not invented ones —
they are the cases where the skill must stay out of the way.
