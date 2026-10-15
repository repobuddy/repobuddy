---
subject: packages/buddy/skills/scaffold/SKILL.md
eval:
  layers: [trigger, behavior]
  judge:
    model: claude-sonnet-4-6
    default_threshold: 4
  trigger:
    activation_threshold: 0.8
    runs: 3
---

# scaffold — measurement policy

The subject is `packages/buddy/skills/scaffold/SKILL.md` together with its `references/` copy of
`scaffold.contract`. No recipe ships with the skill; the fixture supplies made-up
`scaffold.recipe.<name>` references and the `reference search` and `reference show` output the
scenarios name.

**Trigger and behavior carry signal; quality does not yet.** Trigger: the skill sits beside
`setup-github-repo` and `init-buddy`, which also set a repository up, and near a request to write a
recipe, which it does not do. Behavior: the prefix filter, the contract check, the `Order` and `Hosts`
stops, the single confirmation before any write, and an honest `Verify` report are conduct. How well
the skill reads a real recipe is a gradient worth a `@rubric` once one has been run through it; none is
written until then.

## Known weaknesses

The suite was written without a cold spec-judge round and has not been run: no ACED judge was run in
the change that wrote it. No real recipe exists to run it against (see the unit's "Input from a real
recipe"). Scenarios that assert nothing was written rely on the narrated transcript, as in
`project-tracker`.
