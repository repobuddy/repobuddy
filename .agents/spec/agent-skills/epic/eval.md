---
subject: packages/buddy/skills/epic/SKILL.md
eval:
  layers: [trigger, behavior]
  judge:
    model: claude-sonnet-4-6
    default_threshold: 4
  trigger:
    activation_threshold: 0.8
    runs: 3
---

# epic — measurement policy

The subject is `packages/buddy/skills/epic/SKILL.md` together with its `references/` copies: the GitHub
capabilities reference (whose `Retype` the judge follows), `project-tracker.contract`,
`repobuddy.work-levels`, and the epic and initiative templates. The Asana scenarios assume
`project-tracker.capabilities.asana` from `cyber-asana` as published; the fixture supplies it.

**Trigger and behavior carry signal; quality does not yet.** Trigger: the skill sits beside `issue` and
`project-tracker`, which share "issue", "epic", and "tracker". Behavior: asking before naming children,
spiking unknowns, attaching instead of duplicating, and every write waiting on a confirmation are
conduct. The quality of a breakdown is a gradient worth a `@rubric` once a real epic has been planned
with the skill; none is written until then.

## Known weaknesses

The suite was written without a cold spec-judge round (no judge agents in the run that wrote it). The
GitHub retype steps were not run against a live repository in this child; the cross-repository attach
was proven by hand when #801 was filed. Scenarios that assert nothing was written rely on the narrated
transcript, as in `project-tracker`.
