---
subject: skills/to-question/SKILL.md
eval:
  layers: [trigger, behavior, quality]
  judge:
    model: claude-sonnet-4-6
    default_threshold: 4
  trigger:
    activation_threshold: 0.8
    runs: 3
---

# to-question — measurement policy

The subject is `skills/to-question/SKILL.md` together with the `assets/` files it loads at runtime;
the judge reads the SKILL.md and follows its references.

**All three layers carry signal**, because the fit tier is `strong`
([README.md](./README.md) `## Use Cases`):

- **trigger** — the skill sits in a repo alongside `create-issue` and
  `research-workbench:community-post`, which share its vocabulary. Whether it engages on the right
  requests is a genuine decision, not a formality.
- **behavior** — the dialect rules, the fallback, and the handoff branches are conduct once engaged.
- **quality** — whether the composed draft is actually answerable is a gradient judgment.

**`activation_threshold` is 0.8, not the 0.5 default.** A skill whose whole job is to be picked
correctly against two near-identical siblings should not clear its trigger bar at coin-flip accuracy.
This is a deliberately demanding bar on first run, and a fail here is information rather than a
defect in the suite.

**`default_threshold: 4` is the fallback only.** The one `@rubric` scenario carries its own inline
`threshold: 7` against a max of 9, which overrides it.

## Known weaknesses in this suite

Recorded from the first ACED run (2026-08-12), which passed 19/19 — a result the judge itself said
overstates the evidence. A reader should not read a green run here as a strong signal until these are
addressed.

**Five scenarios cannot fail under a judged harness.** The case-judge scores a *narrated* transcript
from a simulator that executes nothing, so an assertion about filesystem state or about a command
*not* having run is settled by the simulator's own say-so:

| Scenario | The unobservable part |
|---|---|
| `reads the platform asset rather than recalling its syntax` | that a file was read |
| `does not fall back to markdown for slack` | that a file was *not* read |
| `writes the approved draft to a file on approval` | that `/tmp/question.md` exists |
| `does not copy to the clipboard before approval` | that no command ran |
| `keeps inviting changes rather than handing off unprompted` | that no file was written |

Negative-execution assertions are the weakest of these: a transcript cannot establish absence. These
behaviors are real and worth keeping, but verifying them needs an **execution harness**, not a judge —
tracked as its own issue. Until then, treat their passes as unproven rather than as evidence.

**The trigger bar was not stressed.** All six Examples rows resolved unanimously across three runs,
but the three negatives are lexically obvious ("file a bug", "create a task", "research… then post").
No row sits genuinely near the line, so accuracy 1.00 measures an easy set, not a sharp boundary. The
suite needs a near-miss whose wording does *not* give the answer away — for example a request to
"write up the retry problem for the tracker", which could legitimately be either skill.

**The one `@rubric` scenario cleared by exactly zero margin** (7/9 against `threshold: 7`), losing a
point on both graded dimensions and scoring full marks only on the easiest. It is one run from
failing, which makes it a coin-flip rather than a bar.
