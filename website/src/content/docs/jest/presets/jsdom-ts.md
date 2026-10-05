---
title: jsdom-ts
description: Jest preset for TypeScript in jsdom that picks jsdom-ts-esm or jsdom-ts-cjs from the type field of package.json.
---

`jsdom-ts` resolves to [`jsdom-ts-esm`](/repobuddy/jest/presets/jsdom-ts-esm/) or
[`jsdom-ts-cjs`](/repobuddy/jest/presets/jsdom-ts-cjs/), based on the `type` field of the nearest `package.json`.

## Usage

```js
// jest.config.mjs
export default {
	preset: '@repobuddy/jest/presets/jsdom-ts',
}
```

## Options

None. A preset takes no options.

## Effective config

When the preset loads, it reads the nearest `package.json`, starting from the directory Jest runs in:

| `package.json` `type` | Resolves to |
| --- | --- |
| `"module"` | the [`jsdom-ts-esm`](/repobuddy/jest/presets/jsdom-ts-esm/#effective-config) config |
| anything else, or no `package.json` | the [`jsdom-ts-cjs`](/repobuddy/jest/presets/jsdom-ts-cjs/#effective-config) config |

## Packages it needs

| Resolved to | Packages from `extract.extractPackages()` |
| --- | --- |
| `jsdom-ts-esm` | `@swc/jest`, `jest-environment-jsdom` |
| `jsdom-ts-cjs` | `jest-environment-jsdom`, `jest-esm-transformer-2`, `ts-jest` |

## Behavior

- The choice happens once, when Jest loads the preset, and uses the working directory. See [`ts`](/repobuddy/jest/presets/ts/#behavior).
- An ESM result needs `NODE_OPTIONS=--experimental-vm-modules`.

## `jsdom-ts-watch` variant

`@repobuddy/jest/presets/jsdom-ts-watch` resolves the same way, to `jsdom-ts-esm-watch` or `jsdom-ts-cjs-watch`.

## Examples

The `dual-ts-swc` fixture (`"type": "module"`) uses it in a second config file, with a mapper for `uuid`:

```js
// jest.config.bundle.cjs
/** @type {import('jest').Config} */
const config = {
	preset: '@repobuddy/jest/presets/jsdom-ts',
	detectOpenHandles: true,
	moduleNameMapper: {
		'^uuid$': require.resolve('uuid'),
	},
}

module.exports = config
```

## Related

- [`ts`](/repobuddy/jest/presets/ts/): the same detection for Node.js.
- [DOM tests with jsdom](/repobuddy/jest/guides/jsdom/)
