---
title: Run Node.js tests
description: Configure Vitest with nodeTestPreset() to run tests in Node.js, jsdom, or happy-dom.
---

This guide sets up Vitest to run Node.js tests with [`nodeTestPreset()`](/repobuddy/vitest/reference/node-test-preset/).

## Steps

1. Install the package and Vitest 5:

   ```sh
   pnpm add -D @repobuddy/vitest vitest
   ```

2. Create `vitest.config.ts` and add the preset. Import from `@repobuddy/vitest/config/node`, which does not need the
   Playwright peer:

   ```ts
   import { defineConfig } from 'vitest/config'
   import { nodeTestPreset } from '@repobuddy/vitest/config/node'

   export default defineConfig({
   	plugins: [nodeTestPreset()],
   })
   ```

3. Name Node.js test files `<name>.spec.node.ts` under `src`, `source`, `code`, or `tests`. See
   [Test file names](/repobuddy/vitest/reference/test-file-names/) for every id and extension.

4. To also run general tests such as `a.spec.ts`, pass `includeGeneralTests: true`.

5. To run `.tsx` and `.browser.ts` tests in a simulated DOM, set `environment` to `'jsdom'` or `'happy-dom'` and install
   that package:

   ```sh
   pnpm add -D jsdom
   ```

6. Add the scripts to `package.json`:

   ```json
   {
   	"scripts": {
   		"test": "vitest run",
   		"coverage": "vitest run --coverage"
   	}
   }
   ```

Set Vitest options the preset also sets (such as `test.environment` or `test.testTimeout`) through the preset option or a
later plugin, not in `test`. The preset's values win. See
[Your config and the preset](/repobuddy/vitest/reference/node-test-preset/#your-config-and-the-preset).

## Finished config

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import { nodeTestPreset } from '@repobuddy/vitest/config/node'

export default defineConfig({
	plugins: [nodeTestPreset({ includeGeneralTests: true })],
})
```

## Verify

1. Create `src/sum.spec.node.ts`:

   ```ts
   import { expect, it } from 'vitest'

   it('runs in GMT', () => {
   	expect(process.env['TZ']).toBe('GMT')
   })
   ```

2. Run `pnpm test`. Vitest finds and passes the test. If you set `TZ` in your shell, the preset keeps your value and
   this test fails.

## Related

- [`nodeTestPreset()`](/repobuddy/vitest/reference/node-test-preset/)
- [Node.js and browser tests together](/repobuddy/vitest/guides/node-and-browser/)
