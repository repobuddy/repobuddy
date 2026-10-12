---
"repobuddy": patch
---

The `to-question` and `review-permissions` skill scripts are now compiled from `src` by `plugin build` into one self-contained `.mjs` each, so a skill linked or copied on its own still runs. Every `npx` reference in the skills is pinned to an exact version, and skill links no longer leave the skill folder.
