---
title: ts-esm
description: Jest preset for TypeScript ESM packages on Node.js, transformed by @swc/jest.
---

`ts-esm` runs TypeScript tests as native ES modules in the `node` environment, transformed by `@swc/jest`.

## Usage

```js
// jest.config.mjs
export default {
	preset: '@repobuddy/jest/presets/ts-esm',
}
```

Run Jest with ESM support:

```sh
NODE_OPTIONS=--experimental-vm-modules jest
```

## Options

None. A preset takes no options. Override its keys in your config (see [customize a preset](/repobuddy/jest/guides/customize/)).

## Effective config

Printed from the built preset with Node.js 26, in a directory that has a `src` folder:

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
	coveragePathIgnorePatterns: [
		'\\.(spec|test|unit|accept|integrate|learning|system|perf|stress|load)(\\..*)?\\.(js|jsx|cjs|mjs|ts|tsx|cts|mts)$',
	],
	testEnvironment: 'node',
	testRegex: [
		'\\.(spec|test|unit|accept|integrate|learning|system|perf|stress)(\\.node)?\\.(js|jsx|cjs|mjs|ts|tsx|cts|mts)$',
		'\\.(spec|test|unit|accept|integrate|learning|system|perf|stress)\\.node14\\.(js|jsx|cjs|mjs|ts|tsx|cts|mts)$',
		// one entry per Node.js major, from 15 up to the running major (26 here)
		'\\.(spec|test|unit|accept|integrate|learning|system|perf|stress)\\.node26\\.(js|jsx|cjs|mjs|ts|tsx|cts|mts)$',
	],
}
```

It is built from [`configs.tsEsm`](/repobuddy/jest/api/configs/#tsesm),
[`configs.configSource()`](/repobuddy/jest/api/configs/#configsource), and
[`configs.node`](/repobuddy/jest/api/configs/#node).

## Packages it needs

`extract.extractPackages()` on the preset returns:

```js
['@swc/jest', 'jest-environment-node']
```

Install `@swc/jest` and its peer `@swc/core`. `jest-environment-node` is a dependency of Jest.

## Behavior

- The `moduleNameMapper` entry maps a relative import ending in `.js` to the same path without the extension. TypeScript
  source written as `import { foo } from './foo.js'` resolves to `./foo.ts`.
- `.ts`, `.mts`, and `.tsx` files load as ES modules. `.cts` files are transformed but load as CommonJS.
- `transform` covers JavaScript files too, but Jest's default `transformIgnorePatterns` still skips `node_modules`.
  Dependencies load as they are published.
- `@swc/jest` gets no options from the preset.
- Without `--experimental-vm-modules`, ESM test files fail with `SyntaxError: Cannot use import statement outside a module`.
- Test file names: see [test file names](/repobuddy/jest/reference/test-file-names/#node-presets).

## `ts-esm-watch` variant

`@repobuddy/jest/presets/ts-esm-watch` is `ts-esm` plus the watch plugins of the [`watch`](/repobuddy/jest/presets/watch/)
preset. It also needs `jest-watch-suspend`, `jest-watch-toggle-config`, and `jest-watch-typeahead`.

## Examples

The `two-chalk` fixture in this repository uses the preset as is:

```js
// jest.config.mjs
export default {
	preset: '@repobuddy/jest/presets/ts-esm',
}
```

Add your own mapper. Jest merges it with the preset's `.js` mapper:

```js
// jest.config.mjs
export default {
	preset: '@repobuddy/jest/presets/ts-esm-watch',
	moduleNameMapper: {
		'^#utils$': '<rootDir>/src/utils.ts',
	},
}
```

## Related

- [`ts`](/repobuddy/jest/presets/ts/): picks `ts-esm` or `ts-cjs` from `package.json`.
- [`jsdom-ts-esm`](/repobuddy/jest/presets/jsdom-ts-esm/): the same transform in jsdom.
- [TypeScript with ESM guide](/repobuddy/jest/guides/typescript-esm/)
