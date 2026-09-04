---
'@repobuddy/jest': patch
---

Remove the broken `config.mjs` file from the published package.

`config.mjs` contained `export * from './esm/config.js'`, but no `src/config.ts`
exists and so `esm/config.js` was never emitted. The file shipped in every
release through the `files` list and was not reachable through `exports`, so
importing `@repobuddy/jest/config.mjs` threw `ERR_MODULE_NOT_FOUND`. Verified
against the published 5.0.1 tarball.

Nothing that works today can break: the only thing the file could do was throw.
