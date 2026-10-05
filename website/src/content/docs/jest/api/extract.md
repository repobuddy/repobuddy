---
title: extract
description: List the npm packages a Jest config references, so a missing one can be named before Jest fails.
---

`extract` reads a Jest config object and names the packages it references.

```ts
import { extract } from '@repobuddy/jest'
```

| Member | Kind |
| --- | --- |
| [`extractPackages()`](#extractpackages) | function |
| [`toPackageName()`](#topackagename) | function |
| [`ExtractedPackage`](#extractedpackage) | type |

[`buddy check-deps`](/repobuddy/cli/check-deps/) builds on these functions.

## extractPackages()

Lists the packages a Jest config references.

```ts
function extractPackages(config: Config): ExtractedPackage[]
```

| Parameter | Type | Default | Effect |
| --- | --- | --- | --- |
| `config` | `Config` from `jest` | required | The config object to read. |

Returns one entry per package, sorted by `name`. `specifiers` and `fields` in each entry are sorted too.

Fields it reads:

| Field | How |
| --- | --- |
| `preset`, `resolver`, `runner`, `testRunner`, `testSequencer`, `globalSetup`, `globalTeardown`, `snapshotResolver`, `dependencyExtractor`, `prettierPath` | the string value |
| `setupFiles`, `setupFilesAfterEnv`, `snapshotSerializers` | each entry |
| `testEnvironment` | `node` becomes `jest-environment-node`, `jsdom` becomes `jest-environment-jsdom`, any other value is read as a specifier |
| `transform` | each value, or the first item of a `[name, options]` pair |
| `watchPlugins` | each entry, or the first item of a `[name, options]` pair |
| `reporters` | each entry, skipping the built-in `default`, `github-actions`, and `summary` |
| `moduleNameMapper` | each value, and each item of an array value |
| `projects` | each inline project object, read with the same rules. String entries (paths) are skipped. |

Behavior:

- A specifier that is not a package name is skipped: a relative or absolute path, a `<rootDir>` path, a `node:`
  builtin, or a regex replacement such as `$1`. See [`toPackageName()`](#topackagename).
- It does not load presets. `{ preset: '@repobuddy/jest/presets/ts' }` gives `@repobuddy/jest`, not the packages that
  preset needs. Pass the preset object itself to list those.
- A package referenced more than once appears once, with every specifier and field.

From the spec:

```js
extract.extractPackages({ transform: fields.knownTransforms.tsJestCjs() })
// [
// 	{ name: 'jest-esm-transformer-2', specifiers: ['jest-esm-transformer-2'], fields: ['transform'] },
// 	{ name: 'ts-jest', specifiers: ['ts-jest'], fields: ['transform'] },
// ]
```

```js
extract.extractPackages({ watchPlugins: fields.watchPlugins })
// [
// 	{ name: 'jest-watch-suspend', specifiers: ['jest-watch-suspend'], fields: ['watchPlugins'] },
// 	{ name: 'jest-watch-toggle-config', specifiers: ['jest-watch-toggle-config'], fields: ['watchPlugins'] },
// 	{
// 		name: 'jest-watch-typeahead',
// 		specifiers: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname'],
// 		fields: ['watchPlugins'],
// 	},
// ]
```

```js
extract.extractPackages({ reporters: ['default', 'github-actions', 'summary', ['jest-junit', {}]] })
// [{ name: 'jest-junit', specifiers: ['jest-junit'], fields: ['reporters'] }]
```

```js
extract.extractPackages({
	projects: ['<rootDir>/packages/*', { displayName: 'node', testEnvironment: 'node' }],
	watchPlugins: ['jest-watch-suspend'],
}).map((p) => p.name)
// ['jest-environment-node', 'jest-watch-suspend']
```

List what a preset needs by passing the preset object:

```js
import preset from '@repobuddy/jest/presets/ts-esm'
import { extract } from '@repobuddy/jest'

extract.extractPackages(preset).map((p) => p.name)
// ['@swc/jest', 'jest-environment-node']
```

## toPackageName()

Returns the npm package name of a module specifier.

```ts
function toPackageName(specifier: string): string | undefined
```

| Parameter | Type | Default | Effect |
| --- | --- | --- | --- |
| `specifier` | `string` | required | A module specifier as written in a config. |

Returns the package name, or `undefined` when the specifier does not name a package.

From the spec:

| Input | Output |
| --- | --- |
| `'ts-jest'` | `'ts-jest'` |
| `'jest-watch-typeahead/filename'` | `'jest-watch-typeahead'` |
| `'@swc/jest'` | `'@swc/jest'` |
| `'@repobuddy/jest/presets/ts'` | `'@repobuddy/jest'` |
| `'./setup.ts'`, `'../setup.ts'`, `'/abs/setup.ts'`, `'<rootDir>/setup.ts'` | `undefined` |
| `'$1'` | `undefined` |
| `'node:path'` | `undefined` |
| `''` | `undefined` |
| `'@swc'` | `undefined` |

The name must be a valid lowercase npm name. `'Foo'` returns `undefined`.

## ExtractedPackage

```ts
type ExtractedPackage = {
	name: string // the package name, such as 'jest-watch-typeahead'
	specifiers: string[] // the specifiers as written, such as ['jest-watch-typeahead/filename']
	fields: string[] // the config fields that reference it, such as ['watchPlugins']
}
```

## Related

- [`buddy check-deps`](/repobuddy/cli/check-deps/)
- [Presets](/repobuddy/jest/presets/): each page lists the output for its preset.
