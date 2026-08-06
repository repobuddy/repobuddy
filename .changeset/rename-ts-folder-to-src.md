---
'@repobuddy/typescript': patch
'@repobuddy/jest': patch
'repobuddy': patch
---

Rename the `ts` source folder to `src`.

The published source folder is now `src` instead of `ts`. The public API and all
export specifiers are unchanged; only the shipped file paths differ (relevant to
JSR consumers, which resolve `./src/...` instead of `./ts/...`).
