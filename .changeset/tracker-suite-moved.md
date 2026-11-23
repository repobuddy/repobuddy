---
"repobuddy": major
---

**Breaking:** the `project-tracker`, `issue`, `epic`, and `initiative` skills and every `project-tracker.*` reference moved to the `project-tracker` plugin (npm `cyber-project-tracker`, repository `cyber-uni/project-tracker`). repobuddy now depends on it, so installing repobuddy installs it too. The `research.method` reference and the `epic-plan.mjs` script moved with them.

If your project has `.agents/references/project-tracker.routing.md`, its pins name `repobuddy/project-tracker.<tracker>`. The moved skills still read such a pin as `project-tracker/project-tracker.<tracker>` and say so. To rewrite the pins, run the `project-tracker` skill's change mode, or run:

    perl -pi -e 's#repobuddy/project-tracker\.#project-tracker/project-tracker.#g' .agents/references/project-tracker.routing.md

Do the same for any intake document whose `Pin` names `repobuddy/`.

A customization in `.agents/references/` with `extends: [repobuddy]` on a `project-tracker.*` reference now names a plugin that no longer holds it: change it to `extends: [project-tracker]`. Until then, `reference load` warns about it with `extends-step-missing`.
