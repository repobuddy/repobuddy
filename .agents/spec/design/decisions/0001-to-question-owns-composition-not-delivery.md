# 0001 — `to-question` owns composition and rendering, not delivery

**Status:** accepted (recorded at backfill, 2026-08-12)
**Context:** backfilling a spec for `skills/to-question` after it shipped in PR #577

## Decision

`to-question` composes structured content and renders it into a target platform's markup dialect. It
**hands off at the clipboard** and never posts, files, sends, or authenticates against a platform.

## Why

The alternative — letting `to-question` grow a delivery step per platform — was rejected, on three
grounds.

1. **It would duplicate two shipped skills.** `create-issue` already files GitHub/GitLab issues with
   a dedup search in front of it, and `research-workbench:community-post` already files researched
   posts to a chosen venue. A third delivery path would be a worse copy of both, and it would arrive
   without the dedup check that makes `create-issue` safe.
2. **Its best venues are the undeliverable ones.** Slack, Jira, and email are exactly where an agent
   usually has no session and no token. Composition is the whole of what an agent can contribute
   there, and it is genuinely useful on its own.
3. **Delivery changes the risk class.** Composing text is reversible and private until the human
   pastes it. Posting is neither. Keeping the skill on the safe side of that line means it never
   needs a confirmation gate, which is why it can iterate freely with the user.

## Consequences

- The clipboard (and the file behind it) is the **handoff sink**, and its reliability is therefore
  load-bearing — a failure to copy is a failure of the capability, not a cosmetic warning. This is
  the gap tracked as the clipboard-fallback issue.
- Adding a platform means adding a **markup dialect**, never a delivery integration. That keeps the
  per-platform cost low and is why the platform list can grow cheaply.
- A user who wants the thing *posted* is routed to `create-issue` or `community-post`
  (`design/posting-skill-boundaries.md`), not served here.
