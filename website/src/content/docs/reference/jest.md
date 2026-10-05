---
title: '@repobuddy/jest'
description: Jest presets for TypeScript and JavaScript, ESM and CommonJS, Node.js and jsdom, plus config building blocks, a toSatisfies matcher, and a dependency extractor.
---

`@repobuddy/jest` replaces a hand-written Jest config with one `preset` line. Pick the preset that matches the
language, the module format, and the test environment of the project.

## Install

```sh
# npm
npm install -D @repobuddy/jest

# yarn
yarn add -D @repobuddy/jest

# pnpm
pnpm add -D @repobuddy/jest

# rush
rush add -p @repobuddy/jest --dev
```

Peer dependencies:

| Package | Range | Needed by |
| --- | --- | --- |
| `jest` | `>=29.5.0` | every preset |
| `@swc/jest` | `^0.2.31` | the `ts-esm` presets |
| `ts-jest` | `^29` | the `ts-cjs` presets (optional peer) |
| `jest-esm-transformer-2` | `^1` | the `ts-cjs` and `js-cjs` presets (optional peer) |
| `jest-watch-suspend` | `^1 \|\| ^2` | the `-watch` presets (optional peer) |
| `jest-watch-toggle-config` | `^3` | the `-watch` presets (optional peer) |
| `jest-watch-typeahead` | `^3.0.0` | the `-watch` presets (optional peer) |
| `identity-obj-proxy` | `^3.0.0` | `fields.knownModuleNameMappers.cssAll` (optional peer) |

The `jsdom` presets set `testEnvironment: 'jsdom'`, so those projects also install `jest-environment-jsdom`.

Not sure which packages a preset needs? Run [`buddy check-deps`](/repobuddy/reference/repobuddy/#buddy-check-deps).
It reads your Jest config, follows the preset chain, and lists what `package.json` does not declare.

## Use a preset

```js
// jest.config.mjs
export default {
	preset: '@repobuddy/jest/presets/ts-watch',
}
```

Every preset is exported both as `@repobuddy/jest/presets/<name>` and as `@repobuddy/jest/presets/<name>/jest-preset`.
The package ships ESM and CommonJS builds of each one.

## Presets

| Preset | Language | Modules | Environment | Transform |
| --- | --- | --- | --- | --- |
| `ts` | TypeScript | from `package.json` `type` | node | as `ts-esm` or `ts-cjs` |
| `ts-esm` | TypeScript | ESM | node | `@swc/jest` |
| `ts-cjs` | TypeScript | CommonJS | node | `ts-jest` with `isolatedModules`, `jest-esm-transformer-2` for JS |
| `js-esm` | JavaScript | ESM | node | none |
| `js-cjs` | JavaScript | CommonJS | node | `jest-esm-transformer-2` |
| `jsdom-ts` | TypeScript | from `package.json` `type` | jsdom | as `jsdom-ts-esm` or `jsdom-ts-cjs` |
| `jsdom-ts-esm` | TypeScript | ESM | jsdom | `@swc/jest` |
| `jsdom-ts-cjs` | TypeScript | CommonJS | jsdom | `ts-jest` with `isolatedModules`, `jest-esm-transformer-2` for JS |
| `watch` | any | any | any | adds watch plugins only, for a multi-project config |

Each preset except `watch` has a `-watch` variant (`ts-watch`, `ts-esm-watch`, `jsdom-ts-cjs-watch`, and so on). It
adds these watch plugins:

- `jest-watch-suspend`
- `jest-watch-toggle-config` for `collectCoverage`
- `jest-watch-toggle-config` for `verbose`
- `jest-watch-typeahead/filename`
- `jest-watch-typeahead/testname`

`ts` and `jsdom-ts` read the nearest `package.json` from the current directory. `"type": "module"` selects the ESM
variant. Anything else selects the CommonJS variant.

The ESM presets map relative `./x.js` imports back to `./x`, so TypeScript source that imports with `.js` extensions
resolves.

### Source folder

Every preset sets `roots` and `collectCoverageFrom` to the first folder that exists among `src`, `source`, `ts`, and
`js`. It falls back to `src`. Coverage skips `*.stories.*` files.

### Test file names

The node presets run files named `<name>.<id>.<ext>` and `<name>.<id>.node.<ext>`, where `<id>` is one of `spec`,
`test`, `unit`, `accept`, `integrate`, `learning`, `system`, `perf`, or `stress`. A file can also target a minimum
Node.js major version with `<name>.<id>.node<version>.<ext>`, such as `feature.spec.node18.ts`. It runs on that
version and later.

The jsdom presets run `<name>.<id>.<ext>` and `<name>.<id>.jsdom.<ext>`.

Extensions are `js`, `jsx`, `cjs`, `mjs`, `ts`, `tsx`, `cts`, and `mts`. Test files are excluded from coverage.

### Load tests

`*.load.*` files do not run by default. Run them with a separate config that spreads `configs.nodeLoad`:

```js
// jest.load.config.mjs
import { configs } from '@repobuddy/jest'

export default {
	preset: '@repobuddy/jest/presets/ts-esm',
	...configs.nodeLoad,
}
```

### Customize a preset

Keys in your config replace the preset's, except `moduleNameMapper` and `transform`, which Jest merges with the
preset's, and `setupFiles` and `setupFilesAfterEnv`, which it appends to.

```js
// jest.config.mjs
export default {
	preset: '@repobuddy/jest/presets/ts-esm-watch',
	moduleNameMapper: {
		'^#utils$': '<rootDir>/src/utils.ts',
	},
}
```

Import a preset to read its values:

```js
import preset from '@repobuddy/jest/presets/ts-esm-watch'
```

## Exports

The main entry exports namespaces:

```ts
import { configs, extract, fields, matchers, presets, resolver } from '@repobuddy/jest'
```

| Export | What it holds |
| --- | --- |
| `presets` | Every preset as a config object: `tsEsm`, `tsCjsWatch`, `jsdomTs`, `watch`, and the rest |
| `configs` | The pieces presets are built from |
| `fields` | Values and helpers for individual Jest config fields |
| `extract` | `extractPackages()` and `toPackageName()` |
| `matchers` | `toSatisfies` |
| `resolver` | A Jest resolver that falls back to `package.json` `imports` |

### `configs`

| Export | Value |
| --- | --- |
| `configNode(identifiers?, minNodeVersion?)` | `testEnvironment: 'node'`, `testRegex`, and `coveragePathIgnorePatterns`. `identifiers` defaults to `defaultTestIdentifiers`. `minNodeVersion` defaults to `14`. |
| `node` | `configNode()` |
| `nodeLoad` | `configNode(loadTestIdentifiers)` |
| `jsdom` | `testEnvironment: 'jsdom'` and `testMatch` |
| `configSource(...dirs)` | `roots` and `collectCoverageFrom` for the first existing folder in `dirs`, or the auto-detected one |
| `tsEsm`, `tsCjs`, `jsEsm`, `jsCjs` | The transform settings for each language and module format |
| `defaultTestIdentifiers` | `['spec', 'test', 'unit', 'accept', 'integrate', 'learning', 'system', 'perf', 'stress']` |
| `loadTestIdentifiers` | `['load']` |
| `knownTestIdentifiers` | Both lists combined |

### `fields`

| Export | Value |
| --- | --- |
| `knownTestEnvironments` | `{ jsdom: 'jsdom', node: 'node' }` |
| `knownExtensionsToTreatAsEsm` | `{ js: ['.jsx'], ts: ['.ts', '.mts', '.tsx'] }` |
| `knownModuleNameMappers.tsEsm` | Maps `./x.js` to `./x` |
| `knownModuleNameMappers.cssAll` | Maps CSS, Stylus, Less, and Sass imports to `identity-obj-proxy` |
| `defineModuleNameMappers(...entries)` | Merges mapper objects |
| `knownTransforms.swc(options?)` | `@swc/jest` for every JS and TS extension |
| `knownTransforms.tsJest(options)` | `ts-jest` for `.ts`, `.tsx`, `.cts`, `.mts` |
| `knownTransforms.tsJestCjs(options?)` | `tsJest` with `isolatedModules: true`, plus `esmPackages()` |
| `knownTransforms.tsJestEsm(options?)` | `tsJest` with `isolatedModules: true` and `useESM: true` |
| `knownTransforms.esmPackages()` | `jest-esm-transformer-2` for `.js`, `.jsx`, `.mjs`, `.mjsx` |
| `defineTransform(transform)` | `{ transform }` |
| `knownWatchPlugins` | `suspend()`, `toggleConfig({ setting })`, `typeaheadFilename()`, `typeaheadTestname()` |
| `watchPlugins` | The default watch plugin list used by the `-watch` presets |
| `defineWatchPlugins(plugins?)` | `{ watchPlugins }`, defaulting to `watchPlugins` |

Jest merges a preset's `transform` with the one in your config, so swapping a transformer through `preset` leaves
both in place. Compose the config from `configs` and `fields` instead. This builds the `ts-esm` preset with `ts-jest`
in place of SWC:

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

### `extract`

`extractPackages(config)` lists the packages a Jest config refers to. It reads `preset`, `testEnvironment`,
`transform`, `moduleNameMapper`, `setupFiles`, `setupFilesAfterEnv`, `snapshotSerializers`, `reporters`,
`watchPlugins`, `resolver`, `runner`, `testRunner`, `testSequencer`, `globalSetup`, `globalTeardown`,
`snapshotResolver`, `dependencyExtractor`, `prettierPath`, and inline `projects`. It returns
`{ name, specifiers, fields }[]`, sorted by name.

```ts
import { extract, fields } from '@repobuddy/jest'

extract.extractPackages({ transform: fields.knownTransforms.tsJestCjs() })
// [
//   { name: 'jest-esm-transformer-2', specifiers: ['jest-esm-transformer-2'], fields: ['transform'] },
//   { name: 'ts-jest', specifiers: ['ts-jest'], fields: ['transform'] },
// ]

extract.extractPackages({ testEnvironment: 'jsdom' })
// [{ name: 'jest-environment-jsdom', specifiers: ['jest-environment-jsdom'], fields: ['testEnvironment'] }]
```

The built-in reporters `default`, `github-actions`, and `summary` are skipped.

`toPackageName(specifier)` returns the npm package name of a module specifier, or `undefined` for a relative path,
`<rootDir>` path, or `node:` builtin.

### `matchers`

`toSatisfies(expectation)` passes when the received value satisfies the expectation, using
[`satisfier`](https://www.npmjs.com/package/satisfier). Register it with `expect.extend`:

```ts
import { toSatisfies } from '@repobuddy/jest/matchers'

expect.extend({ toSatisfies })

expect({ a: 1 }).toSatisfies({ a: (x) => x === 1 })
```

A failure names the property and the predicate, such as
`expect 'a' to satisfy x => x === 2, but received 1`. The package augments the `expect` types for `toSatisfies`.

### `resolver`

`resolver.sync` and `resolver.async` wrap Jest's default resolver. When it fails, they resolve the specifier through
the `imports` field of the nearest `package.json`. They drop the `default` condition, so the `node` condition wins.

## Related

- [`repobuddy`](/repobuddy/reference/repobuddy/): `buddy check-deps` and `buddy test-scripts` for Jest projects.
- [Packages overview](/repobuddy/reference/packages/): every package in the repository.
