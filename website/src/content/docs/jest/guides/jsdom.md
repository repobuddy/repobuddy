---
title: Test DOM code with jsdom
description: Run TypeScript tests in the jsdom environment with a jsdom preset, and map CSS imports with identity-obj-proxy.
---

This guide runs TypeScript tests that touch the DOM. The jsdom presets set `testEnvironment: 'jsdom'` and their own
test file glob.

## Steps

1. Install Jest, the preset package, and the jsdom environment:

	```sh
	pnpm add -D jest @repobuddy/jest jest-environment-jsdom
	```

	`@repobuddy/jest` does not declare `jest-environment-jsdom`, so your package manager will not add it for you.

2. Install the transform for your module format:

	```sh
	# ESM ("type": "module"): jsdom-ts-esm
	pnpm add -D @swc/jest @swc/core cross-env

	# CommonJS: jsdom-ts-cjs
	pnpm add -D ts-jest typescript jest-esm-transformer-2
	```

3. Create the config. `jsdom-ts` picks the ESM or CommonJS preset from `package.json` `type`:

	```js
	// jest.config.mjs
	export default {
		preset: '@repobuddy/jest/presets/jsdom-ts',
	}
	```

4. If the code imports style files, install `identity-obj-proxy` and add the CSS mapper:

	```sh
	pnpm add -D identity-obj-proxy
	```

	```js
	// jest.config.mjs
	import { fields } from '@repobuddy/jest'

	export default {
		preset: '@repobuddy/jest/presets/jsdom-ts',
		moduleNameMapper: fields.knownModuleNameMappers.cssAll,
	}
	```

	Jest merges this `moduleNameMapper` with the preset's. With `identity-obj-proxy`, `styles.foo` is the string `'foo'`.

5. Name tests `<name>.spec.ts` or `<name>.spec.jsdom.ts`. `<name>.spec.node.ts` files do not run in the jsdom presets.
	See [test file names](/repobuddy/jest/reference/test-file-names/#jsdom-presets).

6. For an ESM package, run Jest with `NODE_OPTIONS=--experimental-vm-modules`.

## Finished config

```js
// jest.config.mjs
import { fields } from '@repobuddy/jest'

export default {
	preset: '@repobuddy/jest/presets/jsdom-ts',
	moduleNameMapper: fields.knownModuleNameMappers.cssAll,
}
```

## Verify

Write a test that imports a CSS module and uses `document`:

```ts
// src/app.spec.ts
import styles from './app.module.css'

it('renders', () => {
	const div = document.createElement('div')
	div.className = styles.foo
	document.body.append(div)
	expect(document.querySelector('.foo')).toBe(div)
})
```

This test passed with `jsdom-ts-cjs`, the `cssAll` mapper, and Jest 30 in a scratch project. TypeScript needs a
declaration for `*.css` imports to type-check it.

## Related

- [`jsdom-ts`](/repobuddy/jest/presets/jsdom-ts/), [`jsdom-ts-esm`](/repobuddy/jest/presets/jsdom-ts-esm/),
  [`jsdom-ts-cjs`](/repobuddy/jest/presets/jsdom-ts-cjs/)
- [`fields.knownModuleNameMappers`](/repobuddy/jest/api/fields/#knownmodulenamemappers)
