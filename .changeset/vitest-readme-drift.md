---
"@repobuddy/vitest": patch
---

The readme no longer says every preset restores mocks (only `browserTestPreset` does), its load-test config no longer also runs the other tests, and its npm badges point at `@repobuddy/vitest`. The `includeGeneralTests` doc comment shows the right glob and no longer lists a `.tsx` file, which is a browser test, as a general test.
