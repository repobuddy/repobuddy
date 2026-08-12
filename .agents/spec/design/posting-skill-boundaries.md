# Posting-skill boundaries

This repo ships three skills that all turn a half-formed thought into text destined for other
people. A skill repo shipping three overlapping posting skills would be a defect, so the boundary is
stated here once, and the capability nodes enact it.

## They partition on delivery, not on content

The tempting read is that they overlap because all three produce structured prose. They do not. The
line that actually separates them is **who puts the text where it is going**.

| Skill | Composes | Delivers | Trigger shape |
|---|---|---|---|
| `to-question` | yes — a fixed section template | **no** — stops at the clipboard | "help me word this so I can post it" |
| `create-issue` | yes — a bug/feature-request shape | **yes** — `gh` / `glab` creates the issue | "file a bug", "open an issue" |
| `research-workbench:community-post` | yes — after running `deep-research` | **yes** — files to the chosen venue | "research this and post it" |

`to-question` is the only one that never touches the network. That is not an omission; it is the
capability. Its platform list is the proof — **Slack, Jira, and email are venues an agent generally
cannot post to**: a Slack DM, a Jira instance behind SSO, a mail client the agent has no session
with. When a human is the delivery mechanism, the useful thing an agent can do is hand them text
that will render correctly when pasted.

## The one real overlap, and how it resolves

`to-question` accepts `github` and `gitlab` as targets, and for those two venues `create-issue` *can*
post. So the same request could plausibly reach either skill.

It resolves on the **verb the user used**, because the verb names the sink:

- **"file / open / create an issue"** → `create-issue`. The user wants the issue to exist. Dedup
  search and environment capture are part of that job and `to-question` does neither.
- **"help me write / word / format this"** → `to-question`. The user is going to paste it themselves,
  possibly into a comment box rather than a new issue, and wants the wording and the markup right.

Where the request is genuinely ambiguous, the discriminator is **dedup**: filing a new issue without
checking for duplicates is a real harm, so a request that would create one belongs to `create-issue`.
Composing text carries no such risk.

`community-post` separates on a different axis again — it is the only one that *researches first*.
A request with no research obligation is not a `community-post` request, however public the venue.

## Consequence for the suites

Each of these three is a near-miss for the others: same domain, same keywords, different intent. The
`to-question` suite therefore carries near-miss scenarios drawn from *this table*, not invented ones —
they are the cases where the skill must stay out of the way.
