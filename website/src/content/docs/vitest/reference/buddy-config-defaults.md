---
title: buddyConfigDefaults
description: The file globs and Vitest test settings that both presets use, for writing a config by hand.
---

`buddyConfigDefaults` is a plain object with the globs and `test` settings that `nodeTestPreset()` and
`browserTestPreset()` apply.

## Usage

```ts
import { buddyConfigDefaults } from '@repobuddy/vitest/config/node'
```

It is also exported from `@repobuddy/vitest/config/browser` and `@repobuddy/vitest/config`.

## Options

None. It is a value, not a function.

## Value

```ts
{
	include: {
		vitestDefault: ['**/*.{test,spec}.?(c|m)[jt]s?(x)'], // Vitest's configDefaults.include
		source: ['{src,source,code}/**/*.{js,mjs,cjs,ts,jsx,tsx,cts,mts}'],
		testGeneral: [
			'{src,source,code,tests}/**/*.{spec,test,unit,accept,integrate,system,perf,stress,study}.{js,cjs,mjs,ts,cts,mts}',
		],
		testNode: [
			'{src,source,code,tests}/**/*.{spec,test,unit,accept,integrate,system,perf,stress,study}.node*.{js,cjs,mjs,ts,cts,mts}',
		],
		testLoad: ['{src,source,code,tests}/**/*.load.{js,cjs,mjs,ts,cts,mts}'],
		testBrowser: [
			'{src,source,code,tests}/**/*.{spec,test,unit,accept,integrate,system,perf,stress,study}.{jsx,tsx}',
			'{src,source,code,tests}/**/*.{spec,test,unit,accept,integrate,system,perf,stress,study}.browser*.{js,jsx,cjs,mjs,ts,tsx,cts,mts}',
		],
	},
	exclude: {
		vitestDefault: ['**/node_modules/**', '**/.git/**'], // Vitest's configDefaults.exclude
		test: [
			'**/*.{spec,test,unit,accept,integrate,system,perf,stress,study,load}.{js,jsx,cjs,mjs,ts,tsx,cts,mts}',
			'**/*.{spec,test,unit,accept,integrate,system,perf,stress,study,load}.*.{js,jsx,cjs,mjs,ts,tsx,cts,mts}',
			'**/*.stories.{js,mjs,jsx,tsx}',
		],
	},
	test: {
		expect: { poll: { timeout: 5000 } },
		server: { deps: { fallbackCJS: true } },
		testTimeout: 30000,
	},
}
```

`vitestDefault` values are read from `vitest/config`'s `configDefaults` at import time. The values above are the ones
Vitest 5 reports.

## Fields

| Field | Used by the presets as | Purpose |
| --- | --- | --- |
| `include.source` | `test.coverage.include` | Source files counted in coverage |
| `include.testGeneral` | `test.include` with `includeGeneralTests` | Platform-agnostic tests |
| `include.testNode` | `test.include` of `nodeTestPreset()` | Node.js tests |
| `include.testBrowser` | `test.include` of `browserTestPreset()`, and of `nodeTestPreset()` with jsdom or happy-dom | Browser tests |
| `include.testLoad` | `test.include` with `includeLoadTests` | Load tests, skipped by default |
| `include.vitestDefault` | not used | Vitest's own default |
| `exclude.test` | `test.coverage.exclude` | Test, load, and story files kept out of coverage |
| `exclude.vitestDefault` | not used | Vitest's own default |
| `test.testTimeout` | `test.testTimeout` | 30 seconds per test |
| `test.expect.poll.timeout` | `test.expect.poll.timeout` | 5 seconds for `expect.poll`. Vitest's 1000 ms default is too short for browser tests on CI. |
| `test.server.deps.fallbackCJS` | `test.server.deps.fallbackCJS` | Lets Vitest use the CommonJS build of a package that has no ESM build |

## Behavior

- `testLoad` is not part of `testGeneral`, `testNode`, or `testBrowser`, so a normal run skips load tests.
- `exclude.test` covers `.load.` files, so load tests are not counted as source in coverage.

## Examples

Set coverage in a root config that runs projects:

```ts
import { defineConfig } from 'vitest/config'
import { buddyConfigDefaults } from '@repobuddy/vitest/config/node'

export default defineConfig({
	test: {
		coverage: {
			include: buddyConfigDefaults.include.source,
			exclude: buddyConfigDefaults.exclude.test,
		},
		projects: ['vitest.config.*.ts'],
	},
})
```

Write a load-test-only config without a preset:

```ts
import { defineConfig } from 'vitest/config'
import { buddyConfigDefaults } from '@repobuddy/vitest/config/node'

export default defineConfig({
	test: {
		...buddyConfigDefaults.test,
		include: buddyConfigDefaults.include.testLoad,
	},
})
```

## Related

- [Test file names](/repobuddy/vitest/reference/test-file-names/)
- [`nodeTestPreset()`](/repobuddy/vitest/reference/node-test-preset/)
- [`browserTestPreset()`](/repobuddy/vitest/reference/browser-test-preset/)
