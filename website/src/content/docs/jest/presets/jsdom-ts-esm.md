---
title: jsdom-ts-esm
description: Jest preset for TypeScript ESM tests in jsdom, transformed by @swc/jest.
---

`jsdom-ts-esm` runs TypeScript tests as native ES modules in the `jsdom` environment, transformed by `@swc/jest`.

## Usage

```js
// jest.config.mjs
export default {
	preset: '@repobuddy/jest/presets/jsdom-ts-esm',
}
```

```sh
NODE_OPTIONS=--experimental-vm-modules jest
```

## Options

None. A preset takes no options.

## Effective config

Printed from the built preset, in a directory that has a `src` folder:

```js
{
	extensionsToTreatAsEsm: ['.ts', '.mts', '.tsx'],
	moduleNameMapper: {
		'^(\\.{1,2}/.*)\\.js$': '$1',
	},
	transform: {
		'^.+\\.(js|jsx|cjs|mjs|ts|tsx|cts|mts)$': '@swc/jest',
	},
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

It is built from [`configs.tsEsm`](/repobuddy/jest/api/configs/#tsesm),
[`configs.configSource()`](/repobuddy/jest/api/configs/#configsource), and
[`configs.jsdom`](/repobuddy/jest/api/configs/#jsdom).

## Packages it needs

`extract.extractPackages()` on the preset returns:

```js
['@swc/jest', 'jest-environment-jsdom']
```

`@repobuddy/jest` does not declare `jest-environment-jsdom`. Install it yourself, along with `@swc/jest` and `@swc/core`.

## Behavior

- Same transform and `.js` import mapping as [`ts-esm`](/repobuddy/jest/presets/ts-esm/#behavior).
- Uses `testMatch` instead of `testRegex`. It runs `<name>.<id>.<ext>` and `<name>.<id>.jsdom.<ext>`. Node-only names
  such as `a.spec.node.ts` do not run. See [test file names](/repobuddy/jest/reference/test-file-names/#jsdom-presets).
- Sets no `coveragePathIgnorePatterns`. Jest skips test files from coverage on its own.

## `jsdom-ts-esm-watch` variant

`@repobuddy/jest/presets/jsdom-ts-esm-watch` is `jsdom-ts-esm` plus the watch plugins of the
[`watch`](/repobuddy/jest/presets/watch/) preset.

## Examples

The `jsdom-ts` fixture in this repository:

```js
// jest.config.mjs
export default {
	preset: '@repobuddy/jest/presets/jsdom-ts-esm-watch',
}
```

## Related

- [`jsdom-ts`](/repobuddy/jest/presets/jsdom-ts/), [`jsdom-ts-cjs`](/repobuddy/jest/presets/jsdom-ts-cjs/)
- [DOM tests with jsdom](/repobuddy/jest/guides/jsdom/)
