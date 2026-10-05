---
title: Test a monorepo with projects
description: Run several packages from one Jest config with projects, a base preset per package, and the watch preset at the root.
---

This guide runs the tests of several packages from the repository root with Jest's `projects` option. Each package
keeps its own config and base preset. The root config holds the watch plugins, because Jest reads `watchPlugins` from
the root config only.

## Steps

1. Give each package its own Jest config with a base preset (not a `-watch` preset):

	```js
	// packages/a/jest.config.mjs
	export default {
		preset: '@repobuddy/jest/presets/ts-esm',
	}
	```

	```js
	// packages/b/jest.config.cjs
	module.exports = {
		preset: '@repobuddy/jest/presets/js-cjs',
	}
	```

	A `-watch` preset inside a project adds nothing. In a scratch run with Jest 30, `jest --showConfig` showed no
	`watchPlugins` when only a project used `ts-esm-watch`.

2. Create the root config with the [`watch`](/repobuddy/jest/presets/watch/) preset and the project list:

	```js
	// jest.config.mjs
	export default {
		preset: '@repobuddy/jest/presets/watch',
		projects: ['<rootDir>/packages/*'],
	}
	```

3. Install the packages every project's preset needs where Jest can resolve them from that project. Jest reports a
	missing one as `Module @swc/jest in the transform option was not found`, with the project's `<rootDir>`.

4. If any project uses an ESM preset, run Jest with `NODE_OPTIONS=--experimental-vm-modules`.

## Detection runs in the working directory

The presets decide two things when Jest loads them, and both use the directory Jest runs in, not the project's
`rootDir`:

- The source folder ([`configSource()`](/repobuddy/jest/api/configs/#configsource)). Run from the root, a project
  whose tests live in `source/` still gets `roots: ['<rootDir>/src']` if the root has no `source` folder. Jest then
  fails with `Directory .../packages/b/src in the roots[0] option was not found`.
- ESM or CommonJS for `ts`, `ts-watch`, `jsdom-ts`, and `jsdom-ts-watch`. Run from a root with `"type": "module"`, a
  CommonJS project that uses `ts` gets the `@swc/jest` (ESM) config.

These results come from scratch runs with Jest 30. To avoid both cases:

- Use the explicit presets (`ts-esm`, `ts-cjs`, `jsdom-ts-esm`, `jsdom-ts-cjs`) in projects.
- Use the same source folder name in every project, or set `roots` and `collectCoverageFrom` in the project config with
  [`configs.configSource()`](/repobuddy/jest/api/configs/#configsource):

	```js
	// packages/b/jest.config.mjs
	import { configs } from '@repobuddy/jest'

	export default {
		preset: '@repobuddy/jest/presets/js-cjs',
		...configs.configSource('source'),
	}
	```

	`configSource('source')` with an argument does no detection, and `<rootDir>` resolves per project.

Running Jest inside one package (`cd packages/b && jest`) detects that package's folder and `package.json`.

## Finished config

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

## Verify

```sh
NODE_OPTIONS=--experimental-vm-modules jest
```

With two packages, the summary ends with `Ran all test suites in 2 projects.`. To confirm the watch plugins are set,
run `jest --showConfig` and look for `watchPlugins` in `globalConfig`.

## Related

- [`watch`](/repobuddy/jest/presets/watch/)
- [`extract.extractPackages()`](/repobuddy/jest/api/extract/#extractpackages): reads inline `projects` objects.
