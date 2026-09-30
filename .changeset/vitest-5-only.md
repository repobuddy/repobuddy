---
'@repobuddy/vitest': major
---

Support `vitest` 5 only.

The `vitest` and `@vitest/browser-playwright` peer ranges move from `^4.0.15` to `^5.0.0`.
Stay on 2.x to keep using `vitest` 4.

`browserTestPreset` now runs its `config` hook with `order: 'pre'`.
Vitest 5 sets up the browser server in its own early `config` hook, and only when `test.browser.enabled` is already set.
Without this, a project using the preset failed with "The browser server was not initialized".
