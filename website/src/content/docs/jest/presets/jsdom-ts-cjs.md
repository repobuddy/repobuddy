---
title: jsdom-ts-cjs
description: Jest preset for TypeScript CommonJS tests in jsdom, transformed by ts-jest.
---

`jsdom-ts-cjs` runs TypeScript tests as CommonJS in the `jsdom` environment. `ts-jest` transforms TypeScript, and
`jest-esm-transformer-2` transforms JavaScript, including ESM packages in `node_modules`.

## Usage

```js
// jest.config.js
module.exports = {
	preset: '@repobuddy/jest/presets/jsdom-ts-cjs',
}
```

## Options

None. A preset takes no options.

## Effective config

Printed from the built preset, in a directory that has a `src` folder:

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
	testEnvironment: 'jsdom',
	testMatch: [
		'**/?*\\.(spec|test|unit|accept|integrate|learning|system|perf|stress)?(.jsdom).(js|jsx|cjs|mjs|ts|tsx|cts|mts)',
	],
}
```

It is built from [`configs.tsCjs`](/repobuddy/jest/api/configs/#tscjs),
[`configs.configSource()`](/repobuddy/jest/api/configs/#configsource), and
[`configs.jsdom`](/repobuddy/jest/api/configs/#jsdom).

## Packages it needs

`extract.extractPackages()` on the preset returns:

```js
['jest-environment-jsdom', 'jest-esm-transformer-2', 'ts-jest']
```

`@repobuddy/jest` does not declare `jest-environment-jsdom`. Install it yourself. `ts-jest` also needs `typescript`.

## Behavior

- Same transforms as [`ts-cjs`](/repobuddy/jest/presets/ts-cjs/#behavior), including `transformIgnorePatterns: []`.
- Uses `testMatch` instead of `testRegex`. See [test file names](/repobuddy/jest/reference/test-file-names/#jsdom-presets).
- Sets no `coveragePathIgnorePatterns`. Jest skips test files from coverage on its own.

## `jsdom-ts-cjs-watch` variant

`@repobuddy/jest/presets/jsdom-ts-cjs-watch` is `jsdom-ts-cjs` plus the watch plugins of the
[`watch`](/repobuddy/jest/presets/watch/) preset.

## Examples

```js
// jest.config.js
module.exports = {
	preset: '@repobuddy/jest/presets/jsdom-ts-cjs-watch',
}
```

## Related

- [`jsdom-ts`](/repobuddy/jest/presets/jsdom-ts/), [`jsdom-ts-esm`](/repobuddy/jest/presets/jsdom-ts-esm/)
- [DOM tests with jsdom](/repobuddy/jest/guides/jsdom/)
