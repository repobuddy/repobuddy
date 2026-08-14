---
cr-ref: to-question-spec-backfill
target: skills/to-question
status: in-progress
todos:
  - content: Backfill the SDD spec node for to-question (README + suite)
    status: completed
  - content: Lay the repo-root project spec envelope (.agents/spec/)
    status: completed
  - content: Repair the defects the backfill exposed in the shipped skill
    status: completed
  - content: Write the use-case analysis with keep-or-cut calls
    status: completed
  - content: File issues for the use cases worth building
    status: completed
  - content: Add linear target + markdown baseline fallback
    status: completed
  - content: Frame tracker targets as comments, unlabelled opening line
    status: completed
  - content: Wire up ACED evals (registry, eval.md, results ignore)
    status: completed
  - content: Ship the per-target format checker with the skill
    status: completed
  - content: 'Re-run ACED after the check-format path fix (0db6b52) — that change is unmeasured'
    status: in_progress
  - content: Rebase onto main (branch is 21 behind) before it can land
    status: completed
  - content: 'Decide PR scope: land #577 whole, or split spec-backfill from tooling'
    status: completed
  - content: Human review + merge of PR #577
    status: pending
  - content: 'Run the spec gate to freeze the suite — blocked on #585 by decision, see NEXT'
    status: pending
---

# CR: backfill the `to-question` spec, and widen its use cases

Mission against PR #577, which added `skills/to-question` implementation-first with no spec. Branch
`feat/to-question-skill`. Seventeen commits, `030784e` (the original PR) through `0db6b52`.

## NEXT — resume here

**Do this first.** One change is unmeasured. In order:

1. ~~Catch up to `main`~~ — **done**. `316f530` merged `main` in; `origin/main` (`5b41104`) is an
   ancestor of HEAD, 0 behind / 19 ahead. It landed as a merge, not a rebase; that is fine for a
   squash-merged PR. Do **not** rewrite history while an ACED run is in flight — it rewrites the
   subject files under the judge and invalidates the result.
2. **Re-run ACED — still the live frontier.** Attempted 2026-08-14 and it **died mid-fan-out on an
   account session limit**, not on anything about the subject. Every case-judge and the impl-judge
   parent terminated with `API error: session limit`. **No result file was written and the tree
   stayed clean**, so there is nothing partial to unpick — just re-dispatch when quota allows.
   Spawn the `aced:aced-impl-judge` agent; policy is in
   `.agents/spec/agent-skills/to-question/eval.md`; pass `@rubric` sample count **5** explicitly (it
   is still not in the policy — a known defect, `owner: scenario-writer`). Commit `0db6b52` fixed
   the `check-format.mjs` invocation path *after* the last run, so it is unmeasured — and it is
   exactly the class of change that already proved able to hide behind a green scenario.

   *The guard held under this failure.* With no new result on disk, `validate-skill.mjs` still fails
   `STALE` rather than reporting the old green as current — which is the correct answer for a run
   that never happened. A dead fan-out is a fourth way something unmeasured could look measured, and
   the one the staleness check already covers for free.
3. `node scripts/validate-skill.mjs to-question` must come back with no errors before reporting the
   result to anyone. It fails on a stale or failing run by design.
4. Then it is a human review call. Everything else is green.

**Blocking decisions — one left.**

- **Issue #582** (public posting: Stack Overflow, X, Telegram, Facebook) needs a keep-or-cut call
  before anyone builds it. It may belong to `research-workbench:community-post` rather than here.
  Not blocking this PR.

**Findings the commits will not show.**

- The repo had **no SDD corpus** when this started. `.agents/spec/` (project `repobuddy-repo`) was
  laid as part of this mission. It is a *separate project* from `packages/buddy`'s spec, which
  already existed on `main` — the name collision that forced `repobuddy-repo` is why.
- `main`'s own corpus fails `check-spec-structure` with 11 blocking findings (untagged nodes). The
  Council confirmed this is known and being worked on elsewhere. Do not "fix" it from here.
- The `Title` rule was rewritten **three times** (dropped on trackers → restored → unlabelled
  entirely). The final form has no label at all, because the line had three names (`Title`,
  `Summary`, `Subject`) and each could be misread as naming a property of the tracker item. Do not
  reintroduce a label; see `## Resolved decisions`.
- ACED's case-judge relay is unreliable here: child simulators repeatedly failed to reach
  `aced:aced-case-judge` via SendMessage and leaked verdicts to the parent session instead. A judge
  can also terminate with **no verdict**, which a runner treating "agent completed" as "case
  measured" will bank as a result. Budget for re-dispatches.
- A fan-out parent looks idle by design — its children hold the work. Do not use parent output-file
  size or mtime as a liveness signal; a live run was killed that way this session.

**Do not relearn — see `## Resolved decisions` below**, and the design record in
`.agents/spec/design/posting-skill-boundaries.md`, ADR
`.agents/spec/design/decisions/0001-to-question-owns-composition-not-delivery.md`, and the
chosen-vs-rejected forks in `.agents/spec/agent-skills/to-question/to-question.solution.md`.

## Resolved decisions (settled — do not relitigate)

- **`to-question` composes and renders; it never delivers.** It stops at the clipboard. This is the
  boundary with `create-issue` (which creates items and dedups first) and
  `research-workbench:community-post` (which researches first). The three partition on **delivery**,
  not content — `to-question` is the only one that never touches the network, and Slack/Jira/email
  are precisely the venues an agent usually cannot post to.
- **On trackers the output is a comment on an item that already exists**, never a new item. This is
  the sharper form of the boundary above and it dissolves the GitHub/GitLab overlap entirely:
  `create-issue` owns the create path, `to-question` owns the comment path.
- **The opening line carries no label.** Ask the question directly in one line. Email's subject is a
  separate line for the client's Subject field, never inside the pasted body.
- **Announce a guess, not a certainty.** Defaulting to slack announces; falling back to the markdown
  baseline for an unlisted platform announces; routing `linear` to that same file does **not**,
  because `linear` is a supported target and the shared file is an implementation detail.
- **Linear is a capability-table row, not a seventh dialect file.** Verified against Linear's own
  docs; the one hard constraint is headings capped at four levels.
- **Splitting into two skills (compose vs render) was rejected** — the rendering half has no trigger
  of its own, and this repo already has three skills competing on overlapping triggers.
- **X/Bluesky was cut** from the dialect work: no markup plus a 280-character limit is a different
  composition problem, not a dialect. It resurfaces as part of #582's public-posting category.
- **#577 lands whole, not split** (Council, 2026-08-14). It is a large review surface, and the split
  was available — spec backfill + defect fixes, then Linear (`e8e5d75`) + the format checker
  (`ce50011`) + `scripts/validate-skill.mjs` (`c47c6bb`). It was declined because the pieces
  interlock: the checker and the validator both exist *because* the spec backfill exposed the
  defects they guard, and separating them would ship each half without its reason.
- **The spec gate is held until #585 is resolved** (Council, 2026-08-14). The suite is `status:
  draft` with zero open markers, so freezing is legal — it is declined rather than blocked. Six
  scenarios assert filesystem state or that a command did *not* run, which a narrated transcript
  cannot settle; freezing now would certify a contract whose most important guarantee, the
  clipboard-honesty branch, is guarded by a scenario incapable of failing. The suite stays unfrozen
  until an execution harness exists. Landing #577 does **not** wait on this.

## State

- **Green:** `pnpm verify` 26/26, `check-suite`, `check-spec-structure`, `check-spec-state`,
  `cyber-skills audit validate`. Latest ACED run 23/23 with `implementation_pass: true`.
- **The fix that mattered:** `option_cost` went from mean 1.0/3 to 3/3 in every sample; the rubric
  scenario's total 6.2 → 8.8, clearing threshold 5/5 instead of 2/5.
- **Trigger:** the near-boundary row pair added this session ("for the existing jira ticket" vs "as a
  new jira ticket") produced the only trigger error in 24 runs — a real boundary, not another easy
  pair.
- **PR #577:** `mergeStateStatus: CLEAN` (the `main` merge cleared it), 29 files, +2265/-1. No
  `reviewDecision` yet — human review is the only thing left in front of it.

## Issues opened by this mission

| Issue | Subject |
|---|---|
| #578 | Content shape as a parameter, starting with an "unblock me" shape |
| #579 | Collapse `assets/` into a dialect capability table (partially delivered) |
| #580 | Portable handoff path instead of hardcoded temp file |
| #582 | Public-posting category — needs a keep-or-cut call first |
| #585 | Five scenarios need an execution harness, not a judge |

Upstream, not this repo: a PR against the `cyberplace` repo adds eval-result freshness + trust
checking to ACED, since ACED had the concept in prose with no mechanism behind it.
