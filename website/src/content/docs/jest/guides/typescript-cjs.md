---
title: Test TypeScript CommonJS
description: Set up Jest for a TypeScript package that compiles to CommonJS, using the ts-cjs preset and ts-jest.
---

This guide sets up Jest for a TypeScript package without `"type": "module"`. The
[`ts-cjs`](/repobuddy/jest/presets/ts-cjs/) preset transforms TypeScript with `ts-jest` and transforms ESM-only
dependencies to CommonJS with `jest-esm-transformer-2`.

## Steps

1. Install Jest, the preset package, and the transformers:

	```sh
	pnpm add -D jest @repobuddy/jest ts-jest typescript jest-esm-transformer-2
	```

2. Add the watch plugins if you use `jest --watch`:

	```sh
	pnpm add -D jest-watch-suspend jest-watch-toggle-config jest-watch-typeahead
	```

3. Create `jest.config.js`:

	```js
	// jest.config.js
	module.exports = {
		preset: '@repobuddy/jest/presets/ts-cjs-watch',
	}
	```

	`ts-watch` also works: it picks `ts-cjs-watch` when `package.json` has no `"type": "module"`.

4. Make sure `tsconfig.json` compiles to CommonJS. `ts-jest` reads it.

5. Put tests in the source folder and name them `<name>.spec.ts` or another
	[test file name](/repobuddy/jest/reference/test-file-names/#node-presets).

## Finished config

```js
// jest.config.js
module.exports = {
	preset: '@repobuddy/jest/presets/ts-cjs-watch',
}
```

## Verify

```sh
pnpm exec jest
```

No `NODE_OPTIONS` flag is needed. The `ts-cjs` fixture in this repository runs 14 suites this way, including one that
imports chalk 6, an ESM-only package.

With `ts-jest` 29.4.14 the run prints a warning that the `ts-jest` option `isolatedModules` is deprecated. The preset
sets that option, so the warning appears even when `tsconfig.json` sets `isolatedModules: true`. The tests still run.

## Related

- [`ts-cjs`](/repobuddy/jest/presets/ts-cjs/)
- [`fields.knownTransforms.tsJestCjs()`](/repobuddy/jest/api/fields/#knowntransformstsjestcjs)
