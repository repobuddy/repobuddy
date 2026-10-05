---
title: Entry points
description: Every import path @repobuddy/vitest exports and what each one contains.
---

`@repobuddy/vitest` has six entry points. Each has an `import` condition only; there is no CommonJS build.

| Import | Exports |
| --- | --- |
| `@repobuddy/vitest/config/node` | [`nodeTestPreset`](/repobuddy/vitest/reference/node-test-preset/), [`buddyConfigDefaults`](/repobuddy/vitest/reference/buddy-config-defaults/), [`mergeConfig`](/repobuddy/vitest/reference/merge-config/) |
| `@repobuddy/vitest/config/browser` | [`browserTestPreset`](/repobuddy/vitest/reference/browser-test-preset/), `buddyConfigDefaults`, `mergeConfig` |
| `@repobuddy/vitest/config` | `nodeTestPreset`, `browserTestPreset`, `buddyConfigDefaults`, `mergeConfig` |
| `@repobuddy/vitest/setup/order` | Nothing. A setup file that adds [`expect.order`](/repobuddy/vitest/reference/setup-order/). |
| `@repobuddy/vitest/setup/browser` | Nothing. The [setup file](/repobuddy/vitest/reference/setup-browser/) `browserTestPreset()` adds. |
| `@repobuddy/vitest` | Re-exports [`@repobuddy/test`](/repobuddy/test/): `AssertOrder`, `InvalidOrder`, `installOrder`, `isRunningInTest`, `order`, and the `ExpectWithOrder` and `OrderApi` types |

## Which config entry to import

- `@repobuddy/vitest/config/browser` and `@repobuddy/vitest/config` import `@vitest/browser-playwright` when they load.
  Without that optional peer installed, the import fails.
- In a Node.js-only project, import from `@repobuddy/vitest/config/node`. It does not load
  `@vitest/browser-playwright`.

## Types

The preset option types (`PresetOptions`, `NodePresetOptions`) are not exported. Use
`Parameters<typeof nodeTestPreset>[0]` or `Parameters<typeof browserTestPreset>[0]`. Both presets return Vite's
`Plugin` type.

## Related

- [Reference](/repobuddy/vitest/reference/)
- [`@repobuddy/vitest`](/repobuddy/vitest/)
