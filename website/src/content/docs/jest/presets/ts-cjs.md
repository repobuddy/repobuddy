---
title: ts-cjs
description: Jest preset for TypeScript CommonJS packages on Node.js, transformed by ts-jest, with ESM dependencies transformed to CommonJS.
---

`ts-cjs` runs TypeScript tests as CommonJS in the `node` environment. `ts-jest` transforms TypeScript, and
`jest-esm-transformer-2` transforms JavaScript, including ESM packages in `node_modules`.

## Usage

```js
// jest.config.js
module.exports = {
	preset: '@repobuddy/jest/presets/ts-cjs',
}
```

## Options

None. A preset takes no options.

## Effective config

Printed from the built preset with Node.js 26, in a directory that has a `src` folder:

```js
{
	transform: {
		'^.+\\.(ts|tsx|cts|mts)$': ['ts-jest', { isolatedModules: true }],
		'\\.m?jsx?$': 'jest-esm-transformer-2',
	},
	transformIgnorePatterns: [],
	collectCoverageFrom: [
		'<rootDir>/src/**/*.{js,jsx,cjs,mjs,ts,tsx,cts,mts}',
		'!<rootDir>/src/**/*.stories.*',
	],
	roots: ['<rootDir>/src'],
	coveragePathIgnorePatterns: [
		'\\.(spec|test|unit|accept|integrate|learning|system|perf|stress|load)(\\..*)?\\.(js|jsx|cjs|mjs|ts|tsx|cts|mts)$',
	],
	testEnvironment: 'node',
	testRegex: [
		'\\.(spec|test|unit|accept|integrate|learning|system|perf|stress)(\\.node)?\\.(js|jsx|cjs|mjs|ts|tsx|cts|mts)$',
		'\\.(spec|test|unit|accept|integrate|learning|system|perf|stress)\\.node14\\.(js|jsx|cjs|mjs|ts|tsx|cts|mts)$',
		// one entry per Node.js major, from 15 up to the running major
	],
}
```

It is built from [`configs.tsCjs`](/repobuddy/jest/api/configs/#tscjs),
[`configs.configSource()`](/repobuddy/jest/api/configs/#configsource), and
[`configs.node`](/repobuddy/jest/api/configs/#node).

## Packages it needs

`extract.extractPackages()` on the preset returns:

```js
['jest-environment-node', 'jest-esm-transformer-2', 'ts-jest']
```

`ts-jest` also needs `typescript`.

## Behavior

- `transformIgnorePatterns: []` makes Jest transform files in `node_modules` too. `jest-esm-transformer-2` turns
  ESM-only packages into CommonJS, so `import chalk from 'chalk'` works with chalk 6 in the `ts-cjs` fixture.
- The `.js`, `.jsx`, `.mjs` files of the project also go through `jest-esm-transformer-2`.
- `ts-jest` reads the project's `tsconfig.json`. The preset passes only `isolatedModules: true`, which skips type
  checking.
- With `ts-jest` 29.4.14, the run prints a warning that the `isolatedModules` option of `ts-jest` is deprecated in favor
  of `isolatedModules: true` in `tsconfig.json`. The tests still run.
- Test file names: see [test file names](/repobuddy/jest/reference/test-file-names/#node-presets).

## `ts-cjs-watch` variant

`@repobuddy/jest/presets/ts-cjs-watch` is `ts-cjs` plus the watch plugins of the [`watch`](/repobuddy/jest/presets/watch/)
preset.

## Examples

```js
// jest.config.js
module.exports = {
	preset: '@repobuddy/jest/presets/ts-cjs-watch',
}
```

Pass your own `ts-jest` options. Your `transform` pattern is the same as the preset's, so it replaces that entry and
keeps `jest-esm-transformer-2`:

```js
// jest.config.js
const { fields } = require('@repobuddy/jest')

module.exports = {
	preset: '@repobuddy/jest/presets/ts-cjs',
	transform: fields.knownTransforms.tsJestCjs({ tsconfig: 'tsconfig.test.json' }),
}
```

## Related

- [`ts`](/repobuddy/jest/presets/ts/): picks `ts-esm` or `ts-cjs` from `package.json`.
- [`jsdom-ts-cjs`](/repobuddy/jest/presets/jsdom-ts-cjs/): the same transforms in jsdom.
- [TypeScript with CommonJS guide](/repobuddy/jest/guides/typescript-cjs/)
