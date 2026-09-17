---
'repobuddy': patch
---

The `min-release-age` and `init-buddy` skill scripts are built at release and ship only in the npm package. A skill installed from git, without its `scripts/` folder, runs the same command through `npx -y repobuddy@^1.8.0`.
