---
title: js-cjs
description: Jest preset for JavaScript CommonJS packages on Node.js, with ESM dependencies transformed to CommonJS.
---

`js-cjs` runs JavaScript tests as CommonJS in the `node` environment. `jest-esm-transformer-2` transforms JavaScript,
including ESM packages in `node_modules`.

## Usage

```js
// jest.config.js
module.exports = {
	preset: '@repobuddy/jest/presets/js-cjs',
}
```

## Options

None. A preset takes no options.

## Effective config

Printed from the built preset with Node.js 26, in a directory that has a `src` folder:

```js
{
	transform: {
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
		'\\.(spec|test|unit|accept|integrate|learning|system|perf|stress)\\.node14\\.(js|jtx|cjs|mjs|ts|tsx|cts|mts)$',
		// one entry per Node.js major, from 15 up to the running major
	],
}
```

It is built from [`configs.jsCjs`](/repobuddy/jest/api/configs/#jscjs),
[`configs.configSource()`](/repobuddy/jest/api/configs/#configsource), and
[`configs.node`](/repobuddy/jest/api/configs/#node).

## Packages it needs

`extract.extractPackages()` on the preset returns:

```js
['jest-environment-node', 'jest-esm-transformer-2']
```

## Behavior

- `transformIgnorePatterns: []` makes Jest transform files in `node_modules`. In the `js-cjs` fixture,
  `require('chalk').default` loads chalk 6, an ESM-only package.
- The `transform` pattern matches `.js`, `.jsx`, `.mjs`, and `.mjsx`. `.cjs` files are not transformed.
- Test file names: see [test file names](/repobuddy/jest/reference/test-file-names/#node-presets).

## `js-cjs-watch` variant

`@repobuddy/jest/presets/js-cjs-watch` is `js-cjs` plus the watch plugins of the [`watch`](/repobuddy/jest/presets/watch/)
preset.

## Examples

The `js-cjs` fixture keeps its source in `source/`, which the preset detects:

```js
// jest.config.js
module.exports = {
	preset: '@repobuddy/jest/presets/js-cjs-watch',
	detectOpenHandles: true,
}
```

## Related

- [`js-esm`](/repobuddy/jest/presets/js-esm/)
- [`ts-cjs`](/repobuddy/jest/presets/ts-cjs/)
