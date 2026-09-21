---
'repobuddy': patch
---

`website deploy` for GitHub Pages now looks for a deploy that is already there, including one inside a
called reusable workflow, before adding its own. A job that pushes to a `gh-pages` branch does nothing
while Pages uses the `workflow` build type, so the skill replaces it rather than leaving the site at 404.
The generated workflow writes `workflow_dispatch: {}` so YAML linters accept it, and the base-path step
notes that a path in Astro's `site` does not prefix asset URLs.
