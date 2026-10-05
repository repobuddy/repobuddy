---
title: Test TypeScript ESM
description: Set up Jest for a TypeScript package with type module, using the ts-esm preset and SWC.
---

This guide sets up Jest for a TypeScript package that has `"type": "module"` in `package.json`. The
[`ts-esm`](/repobuddy/jest/presets/ts-esm/) preset transforms TypeScript with `@swc/jest` and runs it as native ESM.

## Steps

1. Install Jest, the preset package, and SWC:

	```sh
	pnpm add -D jest @repobuddy/jest @swc/jest @swc/core cross-env
	```

2. Add the watch plugins if you use `jest --watch`:

	```sh
	pnpm add -D jest-watch-suspend jest-watch-toggle-config jest-watch-typeahead
	```

3. Create `jest.config.mjs`:

	```js
	// jest.config.mjs
	export default {
		preset: '@repobuddy/jest/presets/ts-esm-watch',
	}
	```

	Use `ts-esm` instead if you skipped step 2. `ts-watch` also works: it picks `ts-esm-watch` because of `"type": "module"`.

4. Run Jest with ESM support. Add scripts to `package.json`:

	```json
	{
		"scripts": {
			"test": "cross-env NODE_OPTIONS=--experimental-vm-modules jest",
			"test:watch": "cross-env NODE_OPTIONS=--experimental-vm-modules jest --watch"
		}
	}
	```

	Without the flag, test files fail with `SyntaxError: Cannot use import statement outside a module`.

5. Put tests in the source folder (`src`, `source`, `ts`, or `js`) and name them `<name>.spec.ts` or another
	[test file name](/repobuddy/jest/reference/test-file-names/#node-presets).

6. Import local files with the `.js` extension, as Node.js ESM requires. The preset maps `./foo.js` to `./foo.ts`:

	```ts
	// src/foo.spec.ts
	import { expect, it } from '@jest/globals'
	import { foo } from './foo.js'

	it('works', () => {
		expect(foo).toBe(1)
	})
	```

## Finished config

```js
// jest.config.mjs
export default {
	preset: '@repobuddy/jest/presets/ts-esm-watch',
}
```

## Verify

1. List the test files Jest found:

	```sh
	pnpm exec cross-env NODE_OPTIONS=--experimental-vm-modules jest --listTests
	```

2. Run the tests:

	```sh
	pnpm test
	```

	The `ts-esm` fixture in this repository runs 15 suites this way, including `.mts`, `.cts`, `.tsx`, and
	`.node<major>.ts` files.

## Use ts-jest instead of SWC

The ESM presets use SWC only. To run TypeScript ESM through `ts-jest`, compose the config from `configs` and `fields`
(see [customize a preset](/repobuddy/jest/guides/customize/#replace-the-transformer)).

## Related

- [`ts-esm`](/repobuddy/jest/presets/ts-esm/)
- [`ts`](/repobuddy/jest/presets/ts/)
