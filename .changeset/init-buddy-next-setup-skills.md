---
"repobuddy": minor
---

`init-buddy` now ends by listing the other installed skills that set up a repo, so the user knows what to run next. It finds them by name: `init` / `init-*` skills wire a tool into the repo, and `setup-*` skills configure a hosted service. A skill whose name cannot follow that convention can add `metadata: setup: true` to its frontmatter; `website` now does. It lists one line per skill, leaves out itself and anything already set up, and never runs them.
