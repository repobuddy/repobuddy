---
"repobuddy": minor
---

Build the CLI with tsdown and inline its dependencies, replacing the `tsc` build.

An installed agent plugin is a copy of a source checkout, not an npm install, so its directory has
no reliable `node_modules` and a CLI with external dependencies cannot be run from it. `esm/bin.js`
is now a bundle that inlines `clibuilder` and runs with no `node_modules` present at all, so
`clibuilder` moves from `dependencies` to `devDependencies`.

Published paths do not move: the output stays in `esm/` with a `.js` extension, so the tracked
`bin/buddy.js` shim keeps resolving `../esm/bin.js`. The declaration files `tsc` used to emit
alongside it are gone, which affects nothing — the package exports only `./package.json` and has no
library surface.

Bundling also required pointing `jsonc-parser` (reached through clibuilder) at its ESM build. Its
`main` is a UMD bundle whose factory calls `require("./impl/format")` and three siblings — specifiers
a bundler cannot analyse, so those modules were silently left out and the CLI threw
`Cannot find module './impl/format'` at startup.

Because `tsc` was also typechecking as a side effect of building, the package gains an explicit
`typecheck` script, wired into `verify`.
