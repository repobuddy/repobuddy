---
'repobuddy': patch
---

Load plugins such as `@repobuddy/typescript` from the project the command runs in. The bundled CLI looked for them next to itself, so `buddy ts build` failed in a workspace, and through `npx` or a global install, with `Cannot find package '@repobuddy/typescript'`. The fix is clibuilder 11.3.2.
