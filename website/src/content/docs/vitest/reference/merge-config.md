---
title: mergeConfig()
description: Vitest's mergeConfig, typed to return the intersection of the two configs.
---

`mergeConfig()` calls `mergeConfig` from `vitest/config` and types the result as `base & overrides`.

## Signature

```ts
import { mergeConfig } from '@repobuddy/vitest/config/node'

function mergeConfig<D extends Record<string, any>, O extends Record<string, any> | undefined>(
	base: D,
	overrides: O,
	isRoot?: boolean | undefined,
): D & O
```

It is also exported from `@repobuddy/vitest/config/browser` and `@repobuddy/vitest/config`.

## Arguments

| Argument | Type | Default | Effect |
| --- | --- | --- | --- |
| `base` | object | required | The config to start from |
| `overrides` | object or `undefined` | required | The config merged on top. Its values win. |
| `isRoot` | `boolean` | `true` (Vite's default) | Passed to Vite's `mergeConfig`. Leave it unset when you merge whole configs. |

## Output

A new object. Neither argument is changed.

## Behavior

- Arrays are concatenated: `base` items first, then `overrides` items.
- Objects are merged key by key.
- Other values from `overrides` replace values in `base`.
- `null` and `undefined` values in `overrides` are skipped, so they do not clear a `base` value.
- Passing `undefined` as `overrides` returns a copy of `base`.
- Passing a function config throws `Cannot merge config in form of callback`.

## Examples

```ts
mergeConfig(
	{ test: { name: 'base', include: ['a'], testTimeout: 1 } },
	{ test: { include: ['b'], testTimeout: 2 } },
)
// { test: { name: 'base', include: ['a', 'b'], testTimeout: 2 } }
```

Extend a shared config in a package:

```ts
import { defineConfig } from 'vitest/config'
import { mergeConfig } from '@repobuddy/vitest/config/node'
import shared from '../../vitest.shared.ts'

export default mergeConfig(shared, defineConfig({ test: { name: 'my-package' } }))
```

## Related

- [`buddyConfigDefaults`](/repobuddy/vitest/reference/buddy-config-defaults/)
- [Entry points](/repobuddy/vitest/reference/entry-points/)
