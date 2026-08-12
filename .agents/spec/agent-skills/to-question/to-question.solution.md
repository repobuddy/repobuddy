# to-question — design forks, chosen and rejected

Written alongside the backfill of PR #577. The spec records what the skill *does*; this records what
was considered for it and what was ruled out, so a later reader does not re-litigate settled ground.

Each fork below carries a **keep** or **cut** call. Cuts are the useful half — they say why the skill
should *not* grow in an obvious-looking direction.

---

## 1. The section template is fixed at one content shape

`to-question` composes into exactly one shape: Context → Use Cases → Problem → Options → Questions.
That shape encodes an assumption — that the user is **undecided between alternatives and wants
input**. Where that assumption holds, the template is genuinely good. Where it does not, it misfires,
and the misfire is quiet: the agent will dutifully manufacture an "Options" section for a request
that has no options.

Tested against five other things a person might want to post:

| Content shape | Does the template fit? | Call |
|---|---|---|
| **Bug report** | No. Wants Steps to Reproduce / Expected / Actual / Environment. "Options" is meaningless — a bug has no alternatives to weigh. | **Cut** — `create-issue` already does this properly, including environment capture and a dedup search. Duplicating it here would be a worse copy without the dedup. |
| **RFC / design proposal** | Partly. Motivation → Alternatives → Unresolved questions maps well. The gap is that an RFC *advocates one design*, while this template presents options neutrally. | **Cut for now** — the advocacy shape is `research-workbench:community-post`'s, which additionally gathers prior art. Revisit only if someone wants an RFC without research. |
| **Code-review comment** | No. Wrong scale by an order of magnitude — a review comment is one to three sentences anchored to a line. Five ceremonial sections would be absurd. | **Cut** — not a near-miss, a different genre. |
| **Status update** | No. Done / Next / Blockers. No problem, no options, no questions. | **Cut** — different genre again; `asana-standup` covers the internal case. |
| **"Can someone unblock me" ping** | **Nearly.** Same *situation* as a question — stuck, needs a human — but a different shape: what I'm blocked on, what I've already tried, what I need from you, by when. The template has no slot for the ask or the urgency, which are the two things that make a ping work. | **Keep** — see issue below. |

### The fork: more templates, a parameter, or two skills?

The framing worth taking seriously is that this is really **two concerns**: *structuring the content*
and *rendering it for a platform*. That is true, and the current design hardcodes the first while
parameterising the second.

**Rejected: split into two skills.** The rendering half is not independently useful. Nobody's task is
"render this to mrkdwn" — rendering only has value attached to something composed. Shipping it alone
would add a skill with no trigger of its own, and this repo already has three skills competing on
overlapping triggers. A fourth that fires on nothing is worse than the coupling it removes.

**Chosen: make the content shape an explicit parameter, as the platform already is.** The real model
is a matrix — **shape × dialect** — of which only the `question` row exists today. Adding the
`unblock` row costs one file and no new trigger surface, and it makes the fixed assumption visible
instead of implicit. The renderer stays shared, which is the actual benefit the two-skill split was
reaching for, without the cost.

---

## 2. Platform coverage — is `assets/` the right way to scale?

Candidates raised: Discord, Reddit, Stack Overflow, X/Bluesky, Linear, Notion, Teams.

Sorting them by **dialect** rather than by name is what settles it:

| Candidate | Dialect | Verdict |
|---|---|---|
| Discord, Reddit, Stack Overflow, Linear, Notion, Teams | Markdown, with per-platform subsets — mostly *which* GFM features survive | **Keep**, but not as six more files |
| X / Bluesky | **No markup at all**, plus a hard 280/300-character limit | **Cut** — see below |

**Cut X/Bluesky.** This is not a dialect variation; it is a different composition problem. The
template cannot fit in 280 characters, so supporting X would mean composing something else entirely
(a hook plus a link). That is a different content shape *and* a different medium, and adding it as
an `assets/x.md` would imply the template works there when it cannot.

**The `assets/` pattern is already showing the strain.** `github.md` and `gitlab.md` are near-copies
of each other — `gitlab.md`'s own tips section says "nearly identical to GitHub markdown". Adding six
more Markdown-family files multiplies that duplication, and each copy is a place the syntax table can
drift out of date independently.

**Chosen: collapse the Markdown family into a capability table, keep separate files only for
genuinely divergent dialects.** There are really only three dialect families here — Markdown (with a
per-platform feature matrix: headings? tables? task lists? strikethrough?), Slack mrkdwn, and Jira
wiki markup — plus plain text for email. That structure scales to a new platform by adding a *row*,
not a file, and it makes the differences legible instead of burying them in prose.

This also answers the open question the spec records — what to do when someone asks for a platform
with no asset. Under a capability table there is a sensible default (the Markdown baseline) instead
of the current undefined behavior.

---

## 3. Does this overlap `create-issue` and `research-workbench:community-post`?

Read fully; both are genuinely adjacent. The conclusion is that **there is no duplication, but the
boundary was undocumented**, which is the thing that would have caused trouble.

The three partition on **delivery**, not on content:

| Skill | Composes | Delivers | Researches first |
|---|---|---|---|
| `to-question` | yes | **no** — stops at the clipboard | no |
| `create-issue` | yes | yes (`gh` / `glab`) | no, but dedups |
| `community-post` | yes | yes (venue of choice) | yes |

`to-question` is the only one that never touches the network, and its platform list is the evidence
that this is a real niche rather than an omission: **Slack, Jira and email are precisely the venues
an agent usually cannot post to** — a DM, an SSO-gated tracker, a mail client it has no session with.
Where the human is the delivery mechanism, handing them correctly-rendered text is the whole job.

**The one real overlap** is that `to-question` accepts `github`/`gitlab`, where `create-issue` can
post. **Keep both**, because they serve different acts: `create-issue` makes an issue *exist*
(and must dedup first, since a duplicate issue is a real harm), while `to-question` also serves
pasting into a *comment* box on an existing issue or PR, which `create-issue` does not do. The
disambiguator is the user's verb — "file/open" versus "help me word".

**Done on this branch, no issue needed:** the boundary is now written down in
`design/posting-skill-boundaries.md`, the reasoning in ADR 0001, and — the part that actually binds —
the near-miss scenarios in `to-question.feature` assert the skill *stays out* when the user says
"file a bug" or asks for a researched post. The description was also reworded to lead with its
trigger, since it was the weakest-worded of the three competing for the same requests.

---

## 4. Clipboard as the only sink

**Partly fixed on this branch, partly deferred.**

The crash-level part is fixed: the skill listed three per-OS commands with no selection logic and no
failure branch, then claimed success unconditionally. On a headless agent, in CI, or on Linux without
`xclip`/`wl-copy`, the approved output was silently lost. It now probes, covers Wayland, and on
finding nothing says so and points at the file.

Worth noting that the *displayed* draft is already a fallback of sorts — the text is in the reply
regardless, so nothing is ever truly unrecoverable. That is why this is a correctness-of-reporting
problem rather than a data-loss one, and why the fix is small.

**Deferred:** the sink path is hardcoded to `/tmp/question.md`, which is wrong on native Windows
(the `clip.exe` line implies WSL, but nothing enforces that) and is a poor choice on a shared
machine. **Keep** as a small issue.

**Cut:** anything more elaborate — opening an editor, an OSC-52 terminal escape, a local HTTP handoff.
Each adds a failure mode to a skill whose value is that it is simple, and the reply already carries
the text.

---

## Issues filed

| Fork | Issue |
|---|---|
| 1 — Content shape as a parameter, starting with the unblock-ping shape | [#578](https://github.com/repobuddy/repobuddy/issues/578) |
| 2 — Collapse `assets/` into a capability table; scale platforms by row (also settles the unrecognized-platform question) | [#579](https://github.com/repobuddy/repobuddy/issues/579) |
| 4 — Portable handoff path instead of hardcoded `/tmp/question.md` | [#580](https://github.com/repobuddy/repobuddy/issues/580) |

Fork 3 (the overlap with `create-issue` and `community-post`) needed no issue — it resolved to
"no duplication, boundary undocumented", and the boundary is now documented and enforced by the
suite's near-miss scenarios on this branch.
