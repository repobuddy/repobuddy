---
"@repobuddy/jest": patch
---

The readme now matches the code: the `ts-esm` presets use `@swc/jest`, `jest` and `@swc/jest` are required peers, the resolver has no `@repobuddy/jest/resolver` entry, importing `@repobuddy/jest/matchers` does not register `toSatisfies`, the fields live under `fields` (no `knownRunners` or `knownTestEnvironmentOptions`), and the coverage badge points at this repo.
