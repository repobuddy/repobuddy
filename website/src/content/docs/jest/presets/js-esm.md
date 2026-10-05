---
title: js-esm
description: Jest preset for JavaScript ESM packages on Node.js.
---

`js-esm` runs JavaScript tests as native ES modules in the `node` environment. It sets no transform.

## Usage

```js
// jest.config.mjs
export default {
	preset: '@repobuddy/jest/presets/js-esm',
}
```

```sh
NODE_OPTIONS=--experimental-vm-modules jest
```

## Options

None. A preset takes no options.

## Effective config

Printed from the built preset with Node.js 26, in a directory that has a `src` folder:

```js
{
	extensionsToTreatAsEsm: ['.jsx'],
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

It is built from [`configs.jsEsm`](/repobuddy/jest/api/configs/#jsesm),
[`configs.configSource()`](/repobuddy/jest/api/configs/#configsource), and
[`configs.node`](/repobuddy/jest/api/configs/#node).

## Packages it needs

`extract.extractPackages()` on the preset returns:

```js
['jest-environment-node']
```

That package is a dependency of Jest, so `jest` is the only install.

## Behavior

- The preset sets no `transform`, so Jest's default applies. With Jest 30, `jest --showConfig` in the `js-esm` fixture
  shows `babel-jest` for `\.[jt]sx?$`.
- `.js` files load as ESM because `package.json` has `"type": "module"`. `extensionsToTreatAsEsm` adds `.jsx`.
- Without `--experimental-vm-modules`, ESM test files fail with `SyntaxError: Cannot use import statement outside a module`.
- Test file names: see [test file names](/repobuddy/jest/reference/test-file-names/#node-presets).

## `js-esm-watch` variant

`@repobuddy/jest/presets/js-esm-watch` is `js-esm` plus the watch plugins of the [`watch`](/repobuddy/jest/presets/watch/)
preset.

## Examples

The `js-esm` fixture keeps its source in `js/`, which the preset detects:

```js
// jest.config.mjs
export default {
	preset: '@repobuddy/jest/presets/js-esm',
	detectOpenHandles: true,
}
```

## Related

- [`js-cjs`](/repobuddy/jest/presets/js-cjs/)
- [`ts-esm`](/repobuddy/jest/presets/ts-esm/)
