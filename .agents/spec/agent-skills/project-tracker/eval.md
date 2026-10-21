---
subject: packages/buddy/skills/project-tracker/SKILL.md
eval:
  layers: [trigger, behavior]
  judge:
    model: claude-sonnet-4-6
    default_threshold: 4
  trigger:
    activation_threshold: 0.8
    runs: 3
---

# project-tracker — measurement policy

The subject is `packages/buddy/skills/project-tracker/SKILL.md` together with its `references/` copy of
`project-tracker.contract`, which holds the routing table formats the skill writes and reads.

**Trigger and behavior carry signal; quality does not.** Trigger: the skill sits beside `issue` and
`to-question`, which share "tracker", "issue", and "ticket". Behavior: what to list, which pin form to
write, which pair to refuse, and what to leave unwritten are conduct. No scenario here grades a gradient,
so there is no `@rubric` and no `quality` layer.

**`activation_threshold` is 0.8**, for the same reason as `issue`: the skill is chosen against near
neighbours.

## Known weaknesses

Most scenarios assert that a file was or was not written, or that a command ran with a given result. A
narrated transcript cannot show that no file was written, so the passes of the decline, show, check,
no-routing, and no-capabilities scenarios are unproven by the judge. The resolver behavior the
scenarios rely on (search tagging, qualified names, the ambiguity and missing errors, `where`) was
tested by hand against `cyber-agentkit` with a scratch project; the proof run on a fixture, not
an eval, shows the written routing and the check output. `writes the routing only after the user confirms the summary` states the confirmation in its Given, so it cannot catch a skill that writes before asking; `writes nothing when the user declines the summary` carries that. `ships a Validate section...` is a static
check of files.
