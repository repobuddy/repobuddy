---
title: resolver
description: A Jest resolver that falls back to the imports field of package.json when Jest's default resolver fails.
---

`resolver` wraps Jest's default resolver. When the default resolver throws, it resolves the specifier through the
`imports` field (subpath imports such as `#utils`) of the nearest `package.json`.

```ts
import { resolver } from '@repobuddy/jest'
```

No preset sets `resolver`. Jest's `resolver` option takes a module path, and the package has no
`@repobuddy/jest/resolver` entry, so point Jest at a local file that re-exports it.

## sync

```ts
function sync(path: string, options: ResolverOptions): string | string[] | undefined
```

| Parameter | Type | Default | Effect |
| --- | --- | --- | --- |
| `path` | `string` | required | The specifier to resolve. |
| `options` | `ResolverOptions` from `jest-resolve` | required | Passed by Jest. Uses `basedir`, `conditions`, and `defaultResolver`. |

Returns the resolved path. Behavior:

1. Calls `options.defaultResolver(path, options)` and returns its result when it does not throw.
2. Otherwise reads the nearest `package.json` from `options.basedir`.
3. Resolves `path` through that file's `imports`, with `options.conditions` minus `default`. Jest passes `default`
   before `node`, so dropping it lets the `node` condition win.
4. Resolves the mapped path (or each path of an array) with the default resolver, relative to that `package.json`.
5. Returns `undefined` when `imports` has no match.

## async

```ts
function async(path: string, options: ResolverOptions): Promise<string | string[] | undefined>
```

Same parameters as [`sync`](#sync). Returns `Promise.resolve(sync(path, options))`.

## Use it

1. Add a file that re-exports the namespace:

	```js
	// jest.resolver.cjs
	module.exports = require('@repobuddy/jest').resolver
	```

2. Point `resolver` at it:

	```js
	// jest.config.cjs
	module.exports = {
		preset: '@repobuddy/jest/presets/js-cjs',
		resolver: '<rootDir>/jest.resolver.cjs',
	}
	```

In a scratch run with Jest 30, this config resolved `require('#x')` from `package.json` `imports`. Setting
`resolver: '@repobuddy/jest/resolver'` instead failed with `Module @repobuddy/jest/resolver in the resolver option was
not found`.

Jest 30's default resolver resolved that `#x` import on its own as well. The fallback acts only when the default
resolver throws.

## Related

- [API index](/repobuddy/jest/api/)
