---
title: Presets
description: Every Jest preset in @repobuddy/jest, with its language, module format, environment, and transform.
---

Set a preset with Jest's `preset` key:

```js
// jest.config.mjs
export default {
	preset: '@repobuddy/jest/presets/ts-esm',
}
```

Each preset is exported as `@repobuddy/jest/presets/<name>` and as `@repobuddy/jest/presets/<name>/jest-preset`, in
ESM and CommonJS builds. The same objects are on the [`presets`](/repobuddy/jest/api/presets/) namespace of the main
entry.

| Preset | Language | Module format | Environment | Transform |
| --- | --- | --- | --- | --- |
| [`ts`](/repobuddy/jest/presets/ts/) | TypeScript | from `package.json` `type` | node | as `ts-esm` or `ts-cjs` |
| [`ts-esm`](/repobuddy/jest/presets/ts-esm/) | TypeScript | ESM | node | `@swc/jest` |
| [`ts-cjs`](/repobuddy/jest/presets/ts-cjs/) | TypeScript | CommonJS | node | `ts-jest`, `jest-esm-transformer-2` |
| [`js-esm`](/repobuddy/jest/presets/js-esm/) | JavaScript | ESM | node | Jest's default |
| [`js-cjs`](/repobuddy/jest/presets/js-cjs/) | JavaScript | CommonJS | node | `jest-esm-transformer-2` |
| [`jsdom-ts`](/repobuddy/jest/presets/jsdom-ts/) | TypeScript | from `package.json` `type` | jsdom | as `jsdom-ts-esm` or `jsdom-ts-cjs` |
| [`jsdom-ts-esm`](/repobuddy/jest/presets/jsdom-ts-esm/) | TypeScript | ESM | jsdom | `@swc/jest` |
| [`jsdom-ts-cjs`](/repobuddy/jest/presets/jsdom-ts-cjs/) | TypeScript | CommonJS | jsdom | `ts-jest`, `jest-esm-transformer-2` |
| [`watch`](/repobuddy/jest/presets/watch/) | any | any | any | none, watch plugins only |

## `-watch` variants

Each preset above except `watch` has a `-watch` variant. The variant is the base preset plus the `watchPlugins` of the
[`watch`](/repobuddy/jest/presets/watch/) preset, and nothing else.

| Base | Variant |
| --- | --- |
| `ts` | `ts-watch` |
| `ts-esm` | `ts-esm-watch` |
| `ts-cjs` | `ts-cjs-watch` |
| `js-esm` | `js-esm-watch` |
| `js-cjs` | `js-cjs-watch` |
| `jsdom-ts` | `jsdom-ts-watch` |
| `jsdom-ts-esm` | `jsdom-ts-esm-watch` |
| `jsdom-ts-cjs` | `jsdom-ts-cjs-watch` |

## What every preset except `watch` sets

- `roots` and `collectCoverageFrom` for one source folder. See [`configs.configSource()`](/repobuddy/jest/api/configs/#configsource).
- `testEnvironment` and the test file patterns. See [test file names](/repobuddy/jest/reference/test-file-names/).
- The transform settings for its language and module format.

## How your config combines with a preset

Jest applies these rules (from `jest-config` 30):

- Keys in your config replace the preset's keys.
- `moduleNameMapper` and `transform` merge. Your patterns come first, then the preset's patterns that you did not
  repeat. Jest uses the first `transform` pattern that matches a file.
- `setupFiles` and `setupFilesAfterEnv` concatenate: the preset's entries, then yours.

See [customize a preset](/repobuddy/jest/guides/customize/).
