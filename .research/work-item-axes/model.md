# The working model (draft, November 2026)

The model the owner accepted on 2026-11-16 as the working basis for the `epic` spec's What and Key terms. It is a
position taken from the evidence, not a finding: the sources contradict one another, so each system's terms are mapped
onto this model in [mapping.md](mapping.md), not the other way round. Evidence IDs (E01-E44) are in
[evidence.md](evidence.md).

## Principle

One containment tree carries one axis, value (X1). The other axes are fields on an item and never parents.

## Levels

| Level | Means | Closes when |
| --- | --- | --- |
| Initiative | Several outcomes judged together by one metric | Its outcomes are met or dropped |
| Epic | One bounded outcome with a measure; may mix kinds | The outcome measure is reached, or it is cancelled |
| Issue | One deliverable a person can review in one sitting | It meets the Definition of Done |
| Sub-issue | A step inside an issue | Its step is done |

## Fields

| Axis | Held as | Never |
| --- | --- | --- |
| X2 release | A field naming the release an issue ships in | A parent |
| X3 time box | A field (cycle or sprint) on an issue | A parent; an epic has no appetite (Q7) |
| X4 ownership | One named owner per item | A level |
| X5 certainty | A state or gate (idea, shaped, ready, active) | A level |
| X6 kind | A label (business or enabler, feature, bug, spike) | A level |

## Rules

Each rule names the evidence that supports it and how strong that is.

- **R1. Release span does not change an epic's level.** Supports H3: Fowler's three-month feature released every two
  weeks stays one feature (E30); Patton keeps one backbone item across release lanes (E25); delivery and learning run
  on separate rhythms (E44). No primary text states it outright (E34).
- **R2. An epic's close condition is its outcome measure,** which arrives after the releases that deliver it (E18, E42,
  E44). No tracker closes an epic on its outcome: Jira, GitHub, GitLab, Linear, and Asana close it by hand, and Azure
  DevOps adds an opt-in rule that closes a parent when its children complete (E50, E63, E69, E13, E03, E58). See the
  close table in [mapping.md](mapping.md).
- **R3. An epic may mix kinds.** No primary support and no contradiction. The nearest cases are SAFe's enabler epic and
  Resend's Foundation front (E33, E22). Low confidence.
- **R4. A time box is never a parent.** Linear's cycle, Jira's sprint, GitHub's iteration, and Shape Up's appetite are
  independent of the items they hold (E17, E49, E62, E36). Azure DevOps nests releases inside the iteration path (E53)
  and GitLab lets one milestone serve as a release or a time box (E65); the model keeps X2 and X3 apart anyway, and
  those two systems show the merge is a policy choice.
- **R5. Certainty is a gate on an item at any level.** Shape Up's shaped pitch and bet, Linear's triage and status,
  and Ballarin's spec gate all gate items rather than nest them (E36, E19, E44). Low-medium confidence.
- **R6. An issue is sized to one review sitting.** From E44 (a practitioner book, medium to weak). It sizes the
  bottom level by human review capacity, which suits a repo whose work is largely agent-run. The owner accepted it
  on 2026-11-16.
- **R7. New scope after an outcome is reached opens a linked successor epic.** The `epic` spec's recommendation (Q6).

## Hypotheses and open questions

| Item | Answer | Confidence |
| --- | --- | --- |
| H1: "epic" and "feature" mean different axes in different systems | Holds | High |
| H2: an epic can mix kinds | No primary support, no contradiction | Low |
| H3: release span does not set the value level | Holds by structure; no primary SAFe page supports "an epic spans PIs" | Medium |
| X2 and X3 are one axis or two | Two, bound by policy in Shape Up and release trains | Medium-high |
| X5 has levels | No; a gate or state | Low-medium |
| Q7: an epic carries an appetite | No, as a non-goal; Linear's dates and Shape Up's appetite are the counter-cases (E14, E36) | Medium |

## Decisions recorded

2026-11-16, by the owner:

- The model above is the working basis.
- R6 (issue sized to one review sitting) is part of the model.
- The mapping is a separate central page, [mapping.md](mapping.md), not part of the evidence log.
- The unsourced mapping cells get a fresh sourcing pass before the conclusion.
