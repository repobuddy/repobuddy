---
title: fields
description: Values and helpers for single Jest config fields, such as transform, moduleNameMapper, and watchPlugins.
---

`fields` holds values for one Jest config field each. The `known*` members are ready-made values. The `define*`
functions wrap a value in its field name.

```ts
import { fields } from '@repobuddy/jest'
```

| Member | Field | Kind |
| --- | --- | --- |
| [`knownTestEnvironments`](#knowntestenvironments) | `testEnvironment` | object |
| [`knownExtensionsToTreatAsEsm`](#knownextensionstotreatasesm) | `extensionsToTreatAsEsm` | object |
| [`knownModuleNameMappers`](#knownmodulenamemappers) | `moduleNameMapper` | object |
| [`defineModuleNameMappers()`](#definemodulenamemappers) | `moduleNameMapper` | function |
| [`knownTransforms.swc()`](#knowntransformsswc) | `transform` | function |
| [`knownTransforms.tsJest()`](#knowntransformstsjest) | `transform` | function |
| [`knownTransforms.tsJestCjs()`](#knowntransformstsjestcjs) | `transform` | function |
| [`knownTransforms.tsJestEsm()`](#knowntransformstsjestesm) | `transform` | function |
| [`knownTransforms.esmPackages()`](#knowntransformsesmpackages) | `transform` | function |
| [`defineTransform()`](#definetransform) | `transform` | function |
| [`knownWatchPlugins`](#knownwatchplugins) | `watchPlugins` | object of functions |
| [`watchPlugins`](#watchplugins) | `watchPlugins` | array |
| [`defineWatchPlugins()`](#definewatchplugins) | `watchPlugins` | function |

The package also exports the types `Transform`, `Transform.TsJestOptions`, `Transform.TransformerConfig`,
`WatchPlugins`, `WatchPlugins.BaseOptions`, `WatchPlugins.SuspendOptions`, and `WatchPlugins.ToggleConfig` from this
namespace.

## knownTestEnvironments

```js
{ jsdom: 'jsdom', node: 'node' }
```

## knownExtensionsToTreatAsEsm

```js
{
	js: ['.jsx'],
	ts: ['.ts', '.mts', '.tsx'],
}
```

`configs.tsEsm` uses `ts`. `configs.jsEsm` uses `js`.

## knownModuleNameMappers

| Key | Value | Use |
| --- | --- | --- |
| `tsEsm` | `{ '^(\\.{1,2}/.*)\\.js$': '$1' }` | Map a relative `./x.js` import to `./x`, so TypeScript ESM source resolves. |
| `cssAll` | `{ '\\.module\\.css$': 'identity-obj-proxy', '.+\\.(css\|styl\|less\|sass\|scss)$': 'identity-obj-proxy' }` | Map style imports to `identity-obj-proxy`. Needs the `identity-obj-proxy` package. |

No preset uses `cssAll`. Add it yourself (see [DOM tests with jsdom](/repobuddy/jest/guides/jsdom/)).

## defineModuleNameMappers()

Merges mapper objects into one.

```ts
function defineModuleNameMappers(...entries: Array<Record<string, string>>): Record<string, string>
```

| Parameter | Type | Default | Effect |
| --- | --- | --- | --- |
| `...entries` | `Record<string, string>[]` | none | Mapper objects. A later entry wins on the same key. |

Returns a new object. It does not wrap the result in `{ moduleNameMapper }`.

From the spec:

```js
fields.defineModuleNameMappers(fields.knownModuleNameMappers.tsEsm, fields.knownModuleNameMappers.cssAll)
// {
// 	'^(\\.{1,2}/.*)\\.js$': '$1',
// 	'\\.module\\.css$': 'identity-obj-proxy',
// 	'.+\\.(css|styl|less|sass|scss)$': 'identity-obj-proxy',
// }
```

## knownTransforms.swc()

`@swc/jest` for every JavaScript and TypeScript extension.

```ts
swc(options?: Record<string, unknown>): Record<string, string | [string, Record<string, unknown>]>
```

| Parameter | Type | Default | Effect |
| --- | --- | --- | --- |
| `options` | `Record<string, unknown>` | none | Passed to `@swc/jest`. Without it, the entry is the bare name. |

```js
fields.knownTransforms.swc()
// { '^.+\\.(js|jsx|cjs|mjs|ts|tsx|cts|mts)$': '@swc/jest' }

fields.knownTransforms.swc({ jsc: { target: 'es2022' } })
// { '^.+\\.(js|jsx|cjs|mjs|ts|tsx|cts|mts)$': ['@swc/jest', { jsc: { target: 'es2022' } }] }
```

## knownTransforms.tsJest()

`ts-jest` for `.ts`, `.tsx`, `.cts`, `.mts`, with the options you pass and no defaults.

```ts
tsJest(options: Transform.TsJestOptions): Record<string, string | [string, Record<string, unknown>]>
```

| Parameter | Type | Default | Effect |
| --- | --- | --- | --- |
| `options` | `Transform.TsJestOptions` | required | Passed to `ts-jest`. |

`Transform.TsJestOptions` types these `ts-jest` options: `compiler`, `tsconfig`, `isolatedModules`, `astTransformers`,
`diagnostics` (`boolean` or `{ ignoreCodes }`), `babelConfig`, `stringifyContentPathRegex`, `useESM`.

```js
fields.knownTransforms.tsJest({ tsconfig: 't.json' })
// { '^.+\\.(ts|tsx|cts|mts)$': ['ts-jest', { tsconfig: 't.json' }] }
```

## knownTransforms.tsJestCjs()

`ts-jest` with `isolatedModules: true`, plus [`esmPackages()`](#knowntransformsesmpackages). The `ts-cjs` presets use it.

```ts
tsJestCjs(options?: Transform.TsJestOptions): Record<string, string | [string, Record<string, unknown>]>
```

| Parameter | Type | Default | Effect |
| --- | --- | --- | --- |
| `options` | `Transform.TsJestOptions` | none | Merged over `{ isolatedModules: true }`. |

From the spec:

```js
fields.knownTransforms.tsJestCjs()
// {
// 	'^.+\\.(ts|tsx|cts|mts)$': ['ts-jest', { isolatedModules: true }],
// 	'\\.m?jsx?$': 'jest-esm-transformer-2',
// }
```

Your options keep the default unless you set it:

```js
fields.knownTransforms.tsJestCjs({ isolatedModules: false })
// {
// 	'^.+\\.(ts|tsx|cts|mts)$': ['ts-jest', { isolatedModules: false }],
// 	'\\.m?jsx?$': 'jest-esm-transformer-2',
// }
```

## knownTransforms.tsJestEsm()

`ts-jest` with `isolatedModules: true` and `useESM: true`. No preset uses it. It is the way to run TypeScript ESM
through `ts-jest` instead of SWC.

```ts
tsJestEsm(options?: Transform.TsJestOptions): Record<string, string | [string, Record<string, unknown>]>
```

| Parameter | Type | Default | Effect |
| --- | --- | --- | --- |
| `options` | `Transform.TsJestOptions` | none | Merged over `{ isolatedModules: true, useESM: true }`. |

From the spec:

```js
fields.knownTransforms.tsJestEsm()
// { '^.+\\.(ts|tsx|cts|mts)$': ['ts-jest', { isolatedModules: true, useESM: true }] }
```

## knownTransforms.esmPackages()

`jest-esm-transformer-2` for `.js`, `.jsx`, `.mjs`, `.mjsx`. Pair it with `transformIgnorePatterns: []` so it reaches
`node_modules`.

```ts
esmPackages(): Record<string, string>
```

Parameters: none.

```js
fields.knownTransforms.esmPackages()
// { '\\.m?jsx?$': 'jest-esm-transformer-2' }
```

### Calling `knownTransforms` methods

`tsJestCjs()` and `tsJestEsm()` call `this.tsJest()`. Call them on the object. A destructured call fails:

```js
const { tsJestCjs } = fields.knownTransforms
tsJestCjs()
// TypeError: Cannot read properties of undefined (reading 'tsJest')
```

## defineTransform()

Wraps a transform map in `{ transform }`, typed as Jest's `transform` field.

```ts
function defineTransform(transform: Transform): { transform: Transform }
```

| Parameter | Type | Default | Effect |
| --- | --- | --- | --- |
| `transform` | `Transform` (Jest's `Config['transform']`) | required | The transform map. |

```js
fields.defineTransform(fields.knownTransforms.swc())
// { transform: { '^.+\\.(js|jsx|cjs|mjs|ts|tsx|cts|mts)$': '@swc/jest' } }
```

## knownWatchPlugins

Functions that return one `watchPlugins` entry. Each returns the bare name without options, or `[name, options]` with
options.

| Function | Package entry | Options type |
| --- | --- | --- |
| `suspend(options?)` | `jest-watch-suspend` | `WatchPlugins.SuspendOptions`: `key`, `prompt`, `'suspend-on-start'` |
| `toggleConfig(options?)` | `jest-watch-toggle-config` | `WatchPlugins.ToggleConfig`: `key`, `prompt`, `setting` (required in the type) |
| `typeaheadFilename(options?)` | `jest-watch-typeahead/filename` | `WatchPlugins.BaseOptions`: `key`, `prompt` |
| `typeaheadTestname(options?)` | `jest-watch-typeahead/testname` | `WatchPlugins.BaseOptions`: `key`, `prompt` |

From the spec:

```js
fields.knownWatchPlugins.suspend({ 'suspend-on-start': true })
// ['jest-watch-suspend', { 'suspend-on-start': true }]
```

```js
fields.knownWatchPlugins.toggleConfig({ setting: 'bail' })
// ['jest-watch-toggle-config', { setting: 'bail' }]
```

## watchPlugins

The default plugin list. The [`watch`](/repobuddy/jest/presets/watch/) preset and every `-watch` preset use it.

```js
[
	'jest-watch-suspend',
	['jest-watch-toggle-config', { setting: 'collectCoverage' }],
	['jest-watch-toggle-config', { setting: 'verbose' }],
	'jest-watch-typeahead/filename',
	'jest-watch-typeahead/testname',
]
```

## defineWatchPlugins()

Wraps a plugin list in `{ watchPlugins }`.

```ts
function defineWatchPlugins(config?: WatchPlugins): { watchPlugins: WatchPlugins }
```

| Parameter | Type | Default | Effect |
| --- | --- | --- | --- |
| `config` | `WatchPlugins` (Jest's `Config['watchPlugins']`) | [`watchPlugins`](#watchplugins) | The plugin list. |

```js
fields.defineWatchPlugins([
	fields.knownWatchPlugins.suspend({ 'suspend-on-start': true }),
	fields.knownWatchPlugins.typeaheadFilename({ key: 'f' }),
])
// {
// 	watchPlugins: [
// 		['jest-watch-suspend', { 'suspend-on-start': true }],
// 		['jest-watch-typeahead/filename', { key: 'f' }],
// 	],
// }
```

## Related

- [`configs`](/repobuddy/jest/api/configs/)
- [Customize a preset](/repobuddy/jest/guides/customize/)
