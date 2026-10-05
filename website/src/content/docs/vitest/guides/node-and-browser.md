---
title: Node.js and browser tests together
description: Run both presets as Vitest projects from one root config, with one coverage report.
---

This guide runs Node.js tests and browser tests in one `vitest` command. Each preset gets its own Vitest project, and the
root config owns coverage. This package's own repository uses this layout.

## Steps

1. Install the package, Vitest 5, the Playwright provider, and a coverage provider:

   ```sh
   pnpm add -D @repobuddy/vitest vitest @vitest/browser-playwright @vitest/coverage-v8
   npx playwright install chromium
   ```

2. Create `vitest.config.node.ts`:

   ```ts
   import { defineProject } from 'vitest/config'
   import { nodeTestPreset } from '@repobuddy/vitest/config/node'

   export default defineProject({
   	plugins: [nodeTestPreset({ includeGeneralTests: true })],
   	test: { name: 'node' },
   })
   ```

3. Create `vitest.config.browser.ts`:

   ```ts
   import { defineProject } from 'vitest/config'
   import { browserTestPreset } from '@repobuddy/vitest/config/browser'

   export default defineProject({
   	plugins: [browserTestPreset()],
   	test: { name: 'browser' },
   })
   ```

   Turn on `includeGeneralTests` in one project only, or general tests run twice.

4. Create the root `vitest.config.ts`. Vitest reads `coverage` from the root config only, so set it here:

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

5. Do not name a load test config `vitest.config.load.ts` in this layout. The `vitest.config.*.ts` pattern would add it
   as a project. See [Load tests](/repobuddy/vitest/guides/load-tests/).

## Finished layout

```text
vitest.config.ts          # projects + coverage
vitest.config.node.ts     # nodeTestPreset({ includeGeneralTests: true })
vitest.config.browser.ts  # browserTestPreset()
```

## Verify

1. Run `pnpm vitest run`. The output lists tests under `node` and `browser`. The browser instance shows as
   `browser (chromium)`:

   ```text
   ✓ |node| src/sum.spec.node.ts > runs in GMT
   ✓ |browser (chromium)| src/time-zone.spec.tsx > reports GMT
   ```

2. Run `pnpm vitest run --coverage`. One report covers files under `src`, `source`, and `code`, without test files.
3. Run one project with `pnpm vitest run --project node`.

## Related

- [`nodeTestPreset()`](/repobuddy/vitest/reference/node-test-preset/)
- [`browserTestPreset()`](/repobuddy/vitest/reference/browser-test-preset/)
- [`buddyConfigDefaults`](/repobuddy/vitest/reference/buddy-config-defaults/)
