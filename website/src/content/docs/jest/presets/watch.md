---
title: watch
description: Jest preset that sets only watchPlugins, for the root config of a multi-project setup, and the plugins every -watch preset adds.
---

`watch` sets only `watchPlugins`. Use it at the root of a multi-project config. Every `-watch` preset is its base preset
plus these same plugins.

## Usage

```js
// jest.config.mjs
export default {
	preset: '@repobuddy/jest/presets/watch',
	projects: ['<rootDir>/packages/*'],
}
```

## Options

None. A preset takes no options. To pick other plugins, use
[`fields.defineWatchPlugins()`](/repobuddy/jest/api/fields/#definewatchplugins).

## Effective config

```js
{
	watchPlugins: [
		'jest-watch-suspend',
		['jest-watch-toggle-config', { setting: 'collectCoverage' }],
		['jest-watch-toggle-config', { setting: 'verbose' }],
		'jest-watch-typeahead/filename',
		'jest-watch-typeahead/testname',
	],
}
```

This is [`fields.defineWatchPlugins()`](/repobuddy/jest/api/fields/#definewatchplugins) with its default list,
[`fields.watchPlugins`](/repobuddy/jest/api/fields/#watchplugins).

| Entry | Package | Options |
| --- | --- | --- |
| `jest-watch-suspend` | `jest-watch-suspend` | none |
| `jest-watch-toggle-config` | `jest-watch-toggle-config` | `{ setting: 'collectCoverage' }` |
| `jest-watch-toggle-config` | `jest-watch-toggle-config` | `{ setting: 'verbose' }` |
| `jest-watch-typeahead/filename` | `jest-watch-typeahead` | none |
| `jest-watch-typeahead/testname` | `jest-watch-typeahead` | none |

What each plugin does in `jest --watch` is documented by the plugin's package.

## Packages it needs

`extract.extractPackages()` on the preset returns:

```js
['jest-watch-suspend', 'jest-watch-toggle-config', 'jest-watch-typeahead']
```

All three are optional peers of `@repobuddy/jest`. Install them when you use `watch` or any `-watch` preset.

## The `-watch` variants

For every base preset, `<name>-watch` equals `{ ...<name>, ...watch }`. A check against the built presets confirmed
this for all eight pairs: `ts`, `ts-esm`, `ts-cjs`, `js-esm`, `js-cjs`, `jsdom-ts`, `jsdom-ts-esm`, `jsdom-ts-cjs`.

## Behavior

- `watchPlugins` is a global Jest option. In a multi-project config, Jest reads it from the root config only. A
  `-watch` preset set inside a project adds no plugins: in a scratch run with Jest 30, `jest --showConfig` showed no
  `watchPlugins` until the root config used `watch`.
- `watch` sets nothing else: no environment, transform, roots, or test patterns.

## Examples

Root config of a multi-project repository, with one base preset per project:

```js
// jest.config.mjs
export default {
	preset: '@repobuddy/jest/presets/watch',
	projects: ['<rootDir>/packages/*'],
}
```

```js
// packages/a/jest.config.mjs
export default {
	preset: '@repobuddy/jest/presets/ts-esm',
}
```

## Related

- [Monorepo guide](/repobuddy/jest/guides/monorepo/)
- [`fields.knownWatchPlugins`](/repobuddy/jest/api/fields/#knownwatchplugins)
