---
'repobuddy': minor
---

Add `buddy detect-state`, `buddy scaffold-workflows`, and `buddy npm-trust <plan|apply>`. They run the
same code, with the same flags and output, as the `setup-github-repo` and `setup-npm-trusted-publishing`
skill scripts, which now ship as bundled `.mjs` scripts (built from `src/setup-github-repo/` and
`src/npm-trust/`) instead of hand-written `.mts` files run through `npx tsx`.
