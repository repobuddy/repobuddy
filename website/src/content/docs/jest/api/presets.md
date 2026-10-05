---
title: presets
description: The presets namespace, which holds every Jest preset of @repobuddy/jest as a config object.
---

`presets` holds every preset as a plain config object. Each value is the same object the
`@repobuddy/jest/presets/<name>` entry exports as its default.

```ts
import { presets } from '@repobuddy/jest'
```

Use it to read a preset's values or to spread one into a config. To apply a preset, the `preset` key with the entry
path is the usual way.

## Members

| Member | Entry | Page |
| --- | --- | --- |
| `ts` | `@repobuddy/jest/presets/ts` | [`ts`](/repobuddy/jest/presets/ts/) |
| `tsWatch` | `@repobuddy/jest/presets/ts-watch` | [`ts`](/repobuddy/jest/presets/ts/#ts-watch-variant) |
| `tsEsm` | `@repobuddy/jest/presets/ts-esm` | [`ts-esm`](/repobuddy/jest/presets/ts-esm/) |
| `tsEsmWatch` | `@repobuddy/jest/presets/ts-esm-watch` | [`ts-esm`](/repobuddy/jest/presets/ts-esm/#ts-esm-watch-variant) |
| `tsCjs` | `@repobuddy/jest/presets/ts-cjs` | [`ts-cjs`](/repobuddy/jest/presets/ts-cjs/) |
| `tsCjsWatch` | `@repobuddy/jest/presets/ts-cjs-watch` | [`ts-cjs`](/repobuddy/jest/presets/ts-cjs/#ts-cjs-watch-variant) |
| `jsEsm` | `@repobuddy/jest/presets/js-esm` | [`js-esm`](/repobuddy/jest/presets/js-esm/) |
| `jsEsmWatch` | `@repobuddy/jest/presets/js-esm-watch` | [`js-esm`](/repobuddy/jest/presets/js-esm/#js-esm-watch-variant) |
| `jsCjs` | `@repobuddy/jest/presets/js-cjs` | [`js-cjs`](/repobuddy/jest/presets/js-cjs/) |
| `jsCjsWatch` | `@repobuddy/jest/presets/js-cjs-watch` | [`js-cjs`](/repobuddy/jest/presets/js-cjs/#js-cjs-watch-variant) |
| `jsdomTs` | `@repobuddy/jest/presets/jsdom-ts` | [`jsdom-ts`](/repobuddy/jest/presets/jsdom-ts/) |
| `jsdomTsWatch` | `@repobuddy/jest/presets/jsdom-ts-watch` | [`jsdom-ts`](/repobuddy/jest/presets/jsdom-ts/#jsdom-ts-watch-variant) |
| `jsdomTsEsm` | `@repobuddy/jest/presets/jsdom-ts-esm` | [`jsdom-ts-esm`](/repobuddy/jest/presets/jsdom-ts-esm/) |
| `jsdomTsEsmWatch` | `@repobuddy/jest/presets/jsdom-ts-esm-watch` | [`jsdom-ts-esm`](/repobuddy/jest/presets/jsdom-ts-esm/#jsdom-ts-esm-watch-variant) |
| `jsdomTsCjs` | `@repobuddy/jest/presets/jsdom-ts-cjs` | [`jsdom-ts-cjs`](/repobuddy/jest/presets/jsdom-ts-cjs/) |
| `jsdomTsCjsWatch` | `@repobuddy/jest/presets/jsdom-ts-cjs-watch` | [`jsdom-ts-cjs`](/repobuddy/jest/presets/jsdom-ts-cjs/#jsdom-ts-cjs-watch-variant) |
| `watch` | `@repobuddy/jest/presets/watch` | [`watch`](/repobuddy/jest/presets/watch/) |

## Behavior

- Importing the main entry evaluates every preset. `ts`, `tsWatch`, `jsdomTs`, and `jsdomTsWatch` read `package.json`
  from the working directory, and every preset except `watch` checks for the source folder there.
- The values are shared objects. Copy before you change one: `{ ...presets.tsEsm, roots: ['<rootDir>/lib'] }`.

## Examples

Read a preset's `moduleNameMapper` and extend it:

```js
// jest.config.mjs
import { presets } from '@repobuddy/jest'

export default {
	...presets.tsEsm,
	moduleNameMapper: {
		...presets.tsEsm.moduleNameMapper,
		'^#utils$': '<rootDir>/src/utils.ts',
	},
}
```

The single-preset entry gives the same object:

```js
import tsEsm from '@repobuddy/jest/presets/ts-esm'
```

## Related

- [Presets](/repobuddy/jest/presets/)
- [Customize a preset](/repobuddy/jest/guides/customize/)
