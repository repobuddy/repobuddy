---
title: Customize a preset
description: Override preset keys, add mappers and setup files, change the source folder, or replace the transformer by composing configs and fields.
---

A preset covers the common case. This guide changes one part of it and keeps the rest.

## How Jest combines your config with a preset

From `jest-config` 30:

| Key | Result |
| --- | --- |
| most keys | yours replaces the preset's |
| `moduleNameMapper`, `transform` | merged: your patterns first, then the preset's patterns you did not repeat |
| `setupFiles`, `setupFilesAfterEnv` | concatenated: the preset's entries, then yours |

Jest uses the first `transform` pattern that matches a file.

## Override a key

Set the key in your config:

```js
// jest.config.mjs
export default {
	preset: '@repobuddy/jest/presets/ts-esm',
	testEnvironment: 'jsdom',
}
```

## Add a module mapper

Your entries merge with the preset's `.js` mapper:

```js
// jest.config.mjs
export default {
	preset: '@repobuddy/jest/presets/ts-esm-watch',
	moduleNameMapper: {
		'^#utils$': '<rootDir>/src/utils.ts',
	},
}
```

## Register a matcher for every test

```js
// jest.config.mjs
export default {
	preset: '@repobuddy/jest/presets/ts-esm',
	setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
}
```

```ts
// jest.setup.ts
import { expect } from '@jest/globals'
import { toSatisfies } from '@repobuddy/jest/matchers'

expect.extend({ toSatisfies })
```

## Change the source folder

Detection picks the first of `src`, `source`, `ts`, `js`. To use another folder, or several, spread
[`configs.configSource()`](/repobuddy/jest/api/configs/#configsource) with the names:

```js
// jest.config.mjs
import { configs } from '@repobuddy/jest'

export default {
	preset: '@repobuddy/jest/presets/ts-esm',
	...configs.configSource('lib', 'test'),
}
```

## Pass options to the transformer

Use the same pattern as the preset so your entry replaces it. For `ts-cjs`, call
[`knownTransforms.tsJestCjs()`](/repobuddy/jest/api/fields/#knowntransformstsjestcjs) with your options:

```js
// jest.config.js
const { fields } = require('@repobuddy/jest')

module.exports = {
	preset: '@repobuddy/jest/presets/ts-cjs',
	transform: fields.knownTransforms.tsJestCjs({ tsconfig: 'tsconfig.test.json' }),
}
```

The `dual-ts-jest` fixture does the same with `tsJestEsm()` over `jsdom-ts`.

## Replace the transformer

A different pattern does not remove the preset's entry. With `ts-esm` plus `knownTransforms.tsJestEsm()`,
`jest --showConfig` lists `ts-jest` for `^.+\.(ts|tsx|cts|mts)$` first and `@swc/jest` second. TypeScript files go to
`ts-jest`, and JavaScript files still go to `@swc/jest`.

To drop the preset's transformer completely, build the config from [`configs`](/repobuddy/jest/api/configs/) and
[`fields`](/repobuddy/jest/api/fields/) without `preset`. This is `ts-esm` with `ts-jest` in place of SWC:

```js
// jest.config.mjs
import { configs, fields } from '@repobuddy/jest'

export default {
	...configs.node,
	...configs.configSource(),
	extensionsToTreatAsEsm: fields.knownExtensionsToTreatAsEsm.ts,
	moduleNameMapper: fields.knownModuleNameMappers.tsEsm,
	...fields.defineTransform(fields.knownTransforms.tsJestEsm()),
}
```

`ts-jest` reads `tsconfig.json`, which must emit ESM (for example `"module": "ESNext"`). Run with
`NODE_OPTIONS=--experimental-vm-modules`.

## Verify

Print the merged config and check the keys you changed:

```sh
jest --showConfig
```

## Related

- [Presets](/repobuddy/jest/presets/)
- [`presets` namespace](/repobuddy/jest/api/presets/): read a preset's values in code.
