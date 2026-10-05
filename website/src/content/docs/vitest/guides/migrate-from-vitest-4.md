---
title: Migrate from Vitest 4
description: Move a project that uses @repobuddy/vitest 2.x on Vitest 4 to the release that supports Vitest 5.
---

`@repobuddy/vitest` 2.x has `vitest` and `@vitest/browser-playwright` peer ranges of `^4.0.15`. Version 3, the next
major release, moves both to `^5.0.0` and supports Vitest 5 only. The preset source is unchanged; only the peer ranges
move. To stay on Vitest 4, keep `@repobuddy/vitest` on 2.x.

## Steps

1. Upgrade `@repobuddy/vitest`, `vitest`, and (if you run browser tests) `@vitest/browser-playwright` together:

   ```sh
   pnpm add -D @repobuddy/vitest@^3 vitest@^5 @vitest/browser-playwright@^5
   ```

2. Keep your preset calls as they are. `nodeTestPreset()` and `browserTestPreset()` take the same options.

3. Follow Vitest's own migration notes for changes in your test code and other Vitest options.

## What changed in the presets

- `browserTestPreset()` runs in Vite's `pre` phase (since 2.4.1). Vitest 5 sets up browser mode in its own `pre`
  plugin, which reads `test.browser.enabled` before normal plugins run. Without this, Vitest 5 fails with "The browser
  server was not initialized". A hand-written browser plugin that sets `test.browser.enabled` needs `enforce: 'pre'` for
  the same reason.

## Verify

1. Run `pnpm ls vitest @vitest/browser-playwright`. Both report a 5.x version.
2. Run your tests. The browser project starts without "The browser server was not initialized".

## Related

- [`browserTestPreset()`](/repobuddy/vitest/reference/browser-test-preset/)
- [`@repobuddy/vitest`](/repobuddy/vitest/): supported versions
