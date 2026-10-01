---
'@repobuddy/vitest': patch
---

Run `browserTestPreset()` in the `pre` plugin phase.

Vitest 5 sets up Browser Mode in a `pre` plugin that reads `test.browser.enabled` before normal plugins run.
Without this, Vitest 5 fails with "The browser server was not initialized".
