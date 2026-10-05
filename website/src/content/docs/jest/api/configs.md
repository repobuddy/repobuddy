---
title: configs
description: The partial Jest configs the presets are built from, and the test identifier lists.
---

`configs` holds partial Jest configs. Each preset spreads a few of them together. Spread them yourself to build a
config no preset covers.

```ts
import { configs } from '@repobuddy/jest'
```

| Member | Kind | Sets |
| --- | --- | --- |
| [`configNode()`](#confignode) | function | `testEnvironment: 'node'`, `testRegex`, `coveragePathIgnorePatterns` |
| [`node`](#node) | config | `configNode()` |
| [`nodeLoad`](#nodeload) | config | `configNode(loadTestIdentifiers)` |
| [`jsdom`](#jsdom) | config | `testEnvironment: 'jsdom'`, `testMatch` |
| [`configSource()`](#configsource) | function | `roots`, `collectCoverageFrom` |
| [`tsEsm`](#tsesm) | config | SWC transform and ESM settings for TypeScript |
| [`tsCjs`](#tscjs) | config | `ts-jest` and `jest-esm-transformer-2` transforms |
| [`jsEsm`](#jsesm) | config | `extensionsToTreatAsEsm` for JavaScript |
| [`jsCjs`](#jscjs) | config | `jest-esm-transformer-2` transform |
| [`defaultTestIdentifiers`](#defaulttestidentifiers) | `string[]` | identifiers in a normal run |
| [`loadTestIdentifiers`](#loadtestidentifiers) | `string[]` | `['load']` |
| [`knownTestIdentifiers`](#knowntestidentifiers) | `string[]` | both lists |

The values below were printed from the built package on Node.js 26.

## configNode()

Builds the Node.js environment and test file patterns for a set of identifiers.

```ts
function configNode(
	identifiers?: string[],
	minNodeVersion?: number,
): {
	coveragePathIgnorePatterns: string[]
	testEnvironment: string
	testRegex: string[]
}
```

| Parameter | Type | Default | Effect |
| --- | --- | --- | --- |
| `identifiers` | `string[]` | [`defaultTestIdentifiers`](#defaulttestidentifiers) | The `<id>` part of the test file names to run. |
| `minNodeVersion` | `number` | `14` | The lowest major for `<name>.<id>.node<major>.<ext>` patterns. |

Returns:

- `testEnvironment: 'node'`.
- `testRegex`: one pattern for `<name>.<id>.<ext>` and `<name>.<id>.node.<ext>`, then one pattern per major from
  `minNodeVersion` to the running Node.js major.
- `coveragePathIgnorePatterns`: one pattern that matches every [known identifier](#knowntestidentifiers), whatever
  `identifiers` holds.

Behavior:

- The version list uses `process.version` when `configNode()` runs.
- `minNodeVersion` one above the running major gives no version patterns. A higher value throws
  `RangeError: Invalid array length`.

```js
configs.configNode(['load'], 24)
// {
// 	coveragePathIgnorePatterns: [
// 		'\\.(spec|test|unit|accept|integrate|learning|system|perf|stress|load)(\\..*)?\\.(js|jsx|cjs|mjs|ts|tsx|cts|mts)$',
// 	],
// 	testEnvironment: 'node',
// 	testRegex: [
// 		'\\.(load)(\\.node)?\\.(js|jsx|cjs|mjs|ts|tsx|cts|mts)$',
// 		'\\.(load)\\.node24\\.(js|jsx|cjs|mjs|ts|tsx|cts|mts)$',
// 		'\\.(load)\\.node25\\.(js|jsx|cjs|mjs|ts|tsx|cts|mts)$',
// 		'\\.(load)\\.node26\\.(js|jsx|cjs|mjs|ts|tsx|cts|mts)$',
// 	],
// }
```

Run normal tests and load tests together:

```js
configs.configNode([...configs.defaultTestIdentifiers, ...configs.loadTestIdentifiers])
```

## node

`configNode()` with its defaults. Every node preset spreads it.

```ts
const node: ReturnType<typeof configNode>
```

```js
{
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

## nodeLoad

`configNode(loadTestIdentifiers)`. Runs `*.load.*` files only. A spec asserts that `feature.load.ts` matches and
`feature.spec.ts` does not.

```ts
const nodeLoad: ReturnType<typeof configNode>
```

```js
// jest.load.config.mjs
import { configs } from '@repobuddy/jest'

export default {
	preset: '@repobuddy/jest/presets/ts-esm',
	...configs.nodeLoad,
}
```

See the [load tests guide](/repobuddy/jest/guides/load-tests/).

## jsdom

The jsdom environment and test file glob. Every jsdom preset spreads it.

```ts
const jsdom: { testEnvironment: string; testMatch: string[] }
```

```js
{
	testEnvironment: 'jsdom',
	testMatch: [
		'**/?*\\.(spec|test|unit|accept|integrate|learning|system|perf|stress)?(.jsdom).(js|jsx|cjs|mjs|ts|tsx|cts|mts)',
	],
}
```

`testEnvironment: 'jsdom'` needs the `jest-environment-jsdom` package. The glob is fixed: it does not use
`defaultTestIdentifiers` and has no load-test variant.

## configSource()

Points `roots` and `collectCoverageFrom` at one or more source folders.

```ts
function configSource(...dirs: string[]): {
	collectCoverageFrom: string[]
	roots: string[]
}
```

| Parameter | Type | Default | Effect |
| --- | --- | --- | --- |
| `...dirs` | `string[]` | detected | Folders relative to `<rootDir>`. With none, the first of `src`, `source`, `ts`, `js` that exists is used, or `src` when none exists. |

Behavior:

- Detection checks the folders against the current working directory (`path.resolve(dir)`), not `<rootDir>`.
- Coverage covers `js`, `jsx`, `cjs`, `mjs`, `ts`, `tsx`, `cts`, `mts` files and skips `*.stories.*` files.

From the spec:

```js
configs.configSource('source')
// {
// 	collectCoverageFrom: [
// 		'<rootDir>/source/**/*.{js,jsx,cjs,mjs,ts,tsx,cts,mts}',
// 		'!<rootDir>/source/**/*.stories.*',
// 	],
// 	roots: ['<rootDir>/source'],
// }
```

Several folders:

```js
configs.configSource('lib', 'test')
// {
// 	collectCoverageFrom: [
// 		'<rootDir>/lib/**/*.{js,jsx,cjs,mjs,ts,tsx,cts,mts}',
// 		'!<rootDir>/lib/**/*.stories.*',
// 		'<rootDir>/test/**/*.{js,jsx,cjs,mjs,ts,tsx,cts,mts}',
// 		'!<rootDir>/test/**/*.stories.*',
// 	],
// 	roots: ['<rootDir>/lib', '<rootDir>/test'],
// }
```

## tsEsm

TypeScript as ESM, transformed by `@swc/jest`.

```js
{
	extensionsToTreatAsEsm: ['.ts', '.mts', '.tsx'],
	moduleNameMapper: {
		'^(\\.{1,2}/.*)\\.js$': '$1',
	},
	transform: {
		'^.+\\.(js|jsx|cjs|mjs|ts|tsx|cts|mts)$': '@swc/jest',
	},
}
```

Built from [`fields.knownExtensionsToTreatAsEsm.ts`](/repobuddy/jest/api/fields/#knownextensionstotreatasesm),
[`fields.knownModuleNameMappers.tsEsm`](/repobuddy/jest/api/fields/#knownmodulenamemappers), and
[`fields.knownTransforms.swc()`](/repobuddy/jest/api/fields/#knowntransformsswc).

## tsCjs

TypeScript as CommonJS, transformed by `ts-jest`, with ESM in `node_modules` transformed by `jest-esm-transformer-2`.

```js
{
	transform: {
		'^.+\\.(ts|tsx|cts|mts)$': ['ts-jest', { isolatedModules: true }],
		'\\.m?jsx?$': 'jest-esm-transformer-2',
	},
	transformIgnorePatterns: [],
}
```

Built from [`fields.knownTransforms.tsJestCjs()`](/repobuddy/jest/api/fields/#knowntransformstsjestcjs).

## jsEsm

JavaScript as ESM. Treats `.jsx` as ESM and sets no transform.

```js
{
	extensionsToTreatAsEsm: ['.jsx'],
}
```

## jsCjs

JavaScript as CommonJS, with ESM transformed by `jest-esm-transformer-2`.

```js
{
	transform: {
		'\\.m?jsx?$': 'jest-esm-transformer-2',
	},
	transformIgnorePatterns: [],
}
```

## defaultTestIdentifiers

The identifiers a normal run includes.

```js
['spec', 'test', 'unit', 'accept', 'integrate', 'learning', 'system', 'perf', 'stress']
```

## loadTestIdentifiers

The identifiers for load tests. They are recognized but run only when you ask for them.

```js
['load']
```

## knownTestIdentifiers

`[...defaultTestIdentifiers, ...loadTestIdentifiers]`. `configNode()` uses it for `coveragePathIgnorePatterns`.

```js
['spec', 'test', 'unit', 'accept', 'integrate', 'learning', 'system', 'perf', 'stress', 'load']
```

## Related

- [`fields`](/repobuddy/jest/api/fields/)
- [Customize a preset](/repobuddy/jest/guides/customize/)
- [Test file names](/repobuddy/jest/reference/test-file-names/)
