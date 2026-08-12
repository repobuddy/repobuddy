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
