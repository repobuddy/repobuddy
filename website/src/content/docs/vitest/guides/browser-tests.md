---
title: Run browser tests
description: Configure Vitest browser mode with browserTestPreset() and Playwright.
---

This guide sets up Vitest to run tests in a real browser with
[`browserTestPreset()`](/repobuddy/vitest/reference/browser-test-preset/).

## Steps

1. Install the package, Vitest 5, and the Playwright provider:

   ```sh
   pnpm add -D @repobuddy/vitest vitest @vitest/browser-playwright
   ```

2. Install the browser. The preset uses Chromium unless you choose other instances:

   ```sh
   npx playwright install chromium
   ```

   On CI, install the browser in the job before the tests run.

3. Create `vitest.config.ts` and add the preset:

   ```ts
   import { defineConfig } from 'vitest/config'
   import { browserTestPreset } from '@repobuddy/vitest/config/browser'

   export default defineConfig({
   	plugins: [browserTestPreset()],
   })
   ```

4. Name browser test files `<name>.spec.tsx` or `<name>.spec.browser.ts` under `src`, `source`, `code`, or `tests`. Pass
   `includeGeneralTests: true` to also run general tests such as `a.spec.ts`.

5. To run in other browsers, set `test.browser.instances`. The preset then adds no Chromium instance:

   ```ts
   export default defineConfig({
   	plugins: [browserTestPreset()],
   	test: {
   		browser: {
   			instances: [{ browser: 'chromium' }, { browser: 'firefox' }],
   		},
   	},
   })
   ```

   Install each browser you name, for example `npx playwright install chromium firefox`.

6. Give the config a `test.name` to label the default instance. `name: 'web'` names it `web (chromium)`.

## Screenshots on failure

The default Chromium instance sets `screenshotFailures: false`, so Vitest writes no screenshot when a test fails. The
reason recorded in the package tests: a screenshot written next to the source stopped Storybook from loading. When you
set `test.browser.instances` yourself, the preset does not add this setting. Add `screenshotFailures: false` to your
instances if you need it.

The package does not provide visual or screenshot testing. Use a separate tool for that.

## Finished config

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import { browserTestPreset } from '@repobuddy/vitest/config/browser'

export default defineConfig({
	plugins: [browserTestPreset({ includeGeneralTests: true })],
	test: { name: 'web' },
})
```

## Verify

1. Create `src/time-zone.spec.tsx`:

   ```ts
   import { expect, it } from 'vitest'

   it('reports GMT', () => {
   	expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe('GMT')
   })
   ```

2. Run `pnpm vitest run`. Vitest starts headless Chromium and the test passes. The
   [browser setup file](/repobuddy/vitest/reference/setup-browser/) makes the time zone report `GMT`.

## Related

- [`browserTestPreset()`](/repobuddy/vitest/reference/browser-test-preset/)
- [`@repobuddy/vitest/setup/browser`](/repobuddy/vitest/reference/setup-browser/)
- [Node.js and browser tests together](/repobuddy/vitest/guides/node-and-browser/)
