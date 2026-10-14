---
subject: packages/buddy/skills/initiative/SKILL.md
eval:
  layers: [trigger, behavior]
  judge:
    model: claude-sonnet-4-6
    default_threshold: 4
  trigger:
    activation_threshold: 0.8
    runs: 3
---

# initiative — measurement policy

The subject is `packages/buddy/skills/initiative/SKILL.md` together with its `references/` copies: the
GitHub and GitLab capabilities references (whose `Retype` and `Levels held` the judge follows),
`project-tracker.contract`, `repobuddy.work-levels`, and the initiative and epic templates. The Asana
scenario assumes `project-tracker.capabilities.asana` from `cyber-asana` as published; the fixture
supplies it.

**Trigger and behavior carry signal; quality does not yet.** Trigger: the skill sits beside `epic`,
which also says "promote" and "initiative" (its Demote), so the near misses are a breakdown and a
demotion. Behavior: the metric gate, the `unmeasured` baseline, shells left unbroken, and the epic kept
unchanged on Promote are conduct. Whether a metric is a good one is a gradient worth a `@rubric` once
a real initiative has been filed with the skill; none is written until then.

## Known weaknesses

The suite was written without a cold spec-judge round (no judge agents in the run that wrote it). The
real-initiative input is a dry walk of #801, not a filed initiative: no command that writes ran. The
GitLab rows are untested, as their reference says.
