---
title: Run load tests
description: Keep slow load tests out of the normal run and run them on demand.
---

Load test files (`<name>.load.ts`) match `buddyConfigDefaults.include.testLoad`. Neither preset runs them unless you opt
in, and coverage never counts them as source.

## Steps

1. Name load test files `<name>.load.ts` (or `.js`, `.cjs`, `.mjs`, `.cts`, `.mts`) under `src`, `source`, `code`, or
   `tests`.

2. Create a config that runs only load tests. Use `buddyConfigDefaults` without a preset, because a preset always adds
   its own test globs:

   ```ts
   // vitest.load.config.ts
   import { defineConfig } from 'vitest/config'
   import { buddyConfigDefaults } from '@repobuddy/vitest/config/node'

   export default defineConfig({
   	test: {
   		...buddyConfigDefaults.test,
   		include: buddyConfigDefaults.include.testLoad,
   	},
   })
   ```

   Do not name it `vitest.config.load.ts` when your root config uses `projects: ['vitest.config.*.ts']`. That pattern
   would add it to every run.

3. Add a script:

   ```json
   {
   	"scripts": {
   		"test:load": "vitest run --config vitest.load.config.ts"
   	}
   }
   ```

To run load tests together with the other tests instead, pass `includeLoadTests: true` to the preset. Then every run of
that config includes them:

```ts
export default defineConfig({
	plugins: [nodeTestPreset({ includeLoadTests: true })],
})
```

## Finished config

```ts
// vitest.load.config.ts
import { defineConfig } from 'vitest/config'
import { buddyConfigDefaults } from '@repobuddy/vitest/config/node'

export default defineConfig({
	test: {
		...buddyConfigDefaults.test,
		include: buddyConfigDefaults.include.testLoad,
	},
})
```

This config does not set `TZ`. Set it in the script (`TZ=GMT vitest run ...`) if your load tests depend on it.

## Verify

1. Create `src/sum.load.ts` with one test.
2. Run `pnpm test`. The load test does not run.
3. Run `pnpm test:load`. Only the load test runs.

## Related

- [Test file names](/repobuddy/vitest/reference/test-file-names/)
- [`buddyConfigDefaults`](/repobuddy/vitest/reference/buddy-config-defaults/)
- [`nodeTestPreset()`](/repobuddy/vitest/reference/node-test-preset/)
