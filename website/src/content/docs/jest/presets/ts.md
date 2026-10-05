---
title: ts
description: Jest preset for TypeScript on Node.js that picks ts-esm or ts-cjs from the type field of package.json.
---

`ts` resolves to [`ts-esm`](/repobuddy/jest/presets/ts-esm/) or [`ts-cjs`](/repobuddy/jest/presets/ts-cjs/), based on the
`type` field of the nearest `package.json`.

## Usage

```js
// jest.config.mjs
export default {
	preset: '@repobuddy/jest/presets/ts',
}
```

## Options

None. A preset takes no options.

## Effective config

When the preset loads, it reads the nearest `package.json`, starting from the directory Jest runs in:

| `package.json` `type` | Resolves to |
| --- | --- |
| `"module"` | the [`ts-esm`](/repobuddy/jest/presets/ts-esm/#effective-config) config |
| anything else, or no `package.json` | the [`ts-cjs`](/repobuddy/jest/presets/ts-cjs/#effective-config) config |

The value is the same object as the chosen preset. In a scratch directory with `"type": "module"` and a `ts` folder,
the printed preset had `transform` set to `@swc/jest` and `roots` set to `['<rootDir>/ts']`.

## Packages it needs

`extract.extractPackages()` returns the list of the preset it resolved to:

| Resolved to | Packages |
| --- | --- |
| `ts-esm` | `@swc/jest`, `jest-environment-node` |
| `ts-cjs` | `jest-esm-transformer-2`, `jest-environment-node`, `ts-jest` |

## Behavior

- The choice happens once, when Jest loads the preset. It uses the working directory, not the `rootDir` of a project.
  In a multi-project config run from the repository root, every project gets the root `package.json`'s choice. See
  the [monorepo guide](/repobuddy/jest/guides/monorepo/).
- An ESM result needs `NODE_OPTIONS=--experimental-vm-modules`. See [`ts-esm`](/repobuddy/jest/presets/ts-esm/).

## `ts-watch` variant

`@repobuddy/jest/presets/ts-watch` resolves the same way, to `ts-esm-watch` or `ts-cjs-watch`. Those add the plugins of
the [`watch`](/repobuddy/jest/presets/watch/) preset.

## Examples

The `ts-cjs` fixture has no `type` field, so `ts` resolves to `ts-cjs`:

```js
// jest.config.js
module.exports = {
	preset: '@repobuddy/jest/presets/ts',
	detectOpenHandles: true,
}
```

The `ts-esm` fixture has `"type": "module"`, so `ts-watch` resolves to `ts-esm-watch`:

```js
// jest.config.mjs
export default {
	preset: '@repobuddy/jest/presets/ts-watch',
	detectOpenHandles: true,
}
```

## Related

- [`jsdom-ts`](/repobuddy/jest/presets/jsdom-ts/): the same detection for jsdom.
- [TypeScript with ESM](/repobuddy/jest/guides/typescript-esm/), [TypeScript with CommonJS](/repobuddy/jest/guides/typescript-cjs/)
