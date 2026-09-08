---
'repobuddy': patch
---

`to-question`: bundled files move from `assets/` to `references/`.

The agentskills layout separates the two by kind rather than by topic — `assets/` holds static
resources (templates, images, data files), while documentation the agent reads under a stated
condition belongs in `references/`. Every file this skill bundles is the second kind: the dialect
files and the shape files are read to inform the draft, never copied into it.

No behavior change. The skill loads the same six files under the same conditions; only the paths
inside the package move.
