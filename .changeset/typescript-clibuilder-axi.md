---
"@repobuddy/typescript": minor
---

The `buddy ts` commands follow the AXI conventions of clibuilder 12.2. `buddy ts build` and `buddy ts copy-cjs-package-json` return their result on stdout (TOON by default) instead of progress lines, and a failing `tsc` or an unwritable output directory is a coded error (`tsc-failed`, `copy-failed`) with a help line and exit code 1. A bare `buddy ts` lists the builds that have a `tsconfig.<type>.json` (or says `0 builds found`) and the next steps. Every command has examples in `--help`. The `clibuilder` peer range is now `^12.2.0`.
