---
title: browserTestPreset()
description: A Vite plugin that configures Vitest browser mode with the Playwright provider.
---

`browserTestPreset()` returns a Vite plugin named `@repobuddy/vitest/browser-preset` that turns on Vitest browser mode,
headless, with the Playwright provider and one Chromium instance.

## Usage

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import { browserTestPreset } from '@repobuddy/vitest/config/browser'

export default defineConfig({
	plugins: [browserTestPreset()],
})
```

```ts
function browserTestPreset(options?: {
	includeGeneralTests?: boolean | undefined
	includeLoadTests?: boolean | undefined
}): Plugin
```

Import it from `@repobuddy/vitest/config/browser` or `@repobuddy/vitest/config`. Both load
`@vitest/browser-playwright`, so install that peer. The options type is not exported; use
`Parameters<typeof browserTestPreset>[0]` if you need it.

## Options

| Option | Type | Default | Effect |
| --- | --- | --- | --- |
| `includeGeneralTests` | `boolean` | `false` | Puts `buddyConfigDefaults.include.testGeneral` (for example `a.spec.ts`) first in `test.include` |
| `includeLoadTests` | `boolean` | `false` | Adds `buddyConfigDefaults.include.testLoad` (`a.load.ts`) to the end of `test.include` |

## Effective config

The plugin's `config()` hook returns this `test` config with no options and no `test.name`:

```json
{
	"expect": { "poll": { "timeout": 5000 } },
	"server": { "deps": { "fallbackCJS": true } },
	"testTimeout": 30000,
	"include": [
		"{src,source,code,tests}/**/*.{spec,test,unit,accept,integrate,system,perf,stress,study}.{jsx,tsx}",
		"{src,source,code,tests}/**/*.{spec,test,unit,accept,integrate,system,perf,stress,study}.browser*.{js,jsx,cjs,mjs,ts,tsx,cts,mts}"
	],
	"browser": {
		"enabled": true,
		"headless": true,
		"provider": "<playwright() from @vitest/browser-playwright>",
		"instances": [{ "browser": "chromium", "screenshotFailures": false }]
	},
	"coverage": {
		"include": ["{src,source,code}/**/*.{js,mjs,cjs,ts,jsx,tsx,cts,mts}"],
		"exclude": [
			"**/*.{spec,test,unit,accept,integrate,system,perf,stress,study,load}.{js,jsx,cjs,mjs,ts,tsx,cts,mts}",
			"**/*.{spec,test,unit,accept,integrate,system,perf,stress,study,load}.*.{js,jsx,cjs,mjs,ts,tsx,cts,mts}",
			"**/*.stories.{js,mjs,jsx,tsx}"
		]
	},
	"setupFiles": ["@repobuddy/vitest/setup/browser"]
}
```

What changes it:

| Input | Change |
| --- | --- |
| `includeGeneralTests: true` | `test.include` is `testGeneral`, then `testBrowser` |
| `includeLoadTests: true` | `testLoad` is added after the other globs |
| `test.name: 'My Test'` in your config | The default instance gets `name: 'My Test (chromium)'` |
| `test.browser.instances` in your config | The preset adds no instance; yours are used as they are |

## Behavior

- The plugin runs in Vite's `pre` phase (`enforce: 'pre'`). Vitest 5 sets up browser mode in its own `pre` plugin,
  which reads `test.browser.enabled` before normal plugins run.
- The provider is always Playwright. There is no option to choose another provider.
- The default Chromium instance sets `screenshotFailures: false`, so Vitest does not write a screenshot when a test
  fails. When you set `test.browser.instances` yourself, this setting is not added to your instances.
- The preset adds [`@repobuddy/vitest/setup/browser`](/repobuddy/vitest/reference/setup-browser/) to `test.setupFiles`.
- The preset does not install browsers. Run `npx playwright install chromium` (or the browsers your instances name).
- In a Vitest projects setup, Vitest reads `coverage` from the root config only. Set it there.
- Vite merges the preset's result on top of your config: arrays such as `test.include` and `test.setupFiles` are
  concatenated, and other values from the preset replace yours. To override one, add a plugin after the preset, as shown
  on [`nodeTestPreset()`](/repobuddy/vitest/reference/node-test-preset/#your-config-and-the-preset).

## Examples

Run browser tests and general tests in Chromium:

```ts
export default defineConfig({
	plugins: [browserTestPreset({ includeGeneralTests: true })],
})
```

Run in Firefox and WebKit instead of Chromium:

```ts
export default defineConfig({
	plugins: [browserTestPreset()],
	test: {
		browser: {
			instances: [{ browser: 'firefox' }, { browser: 'webkit' }],
		},
	},
})
```

## Related

- [Run browser tests](/repobuddy/vitest/guides/browser-tests/)
- [`nodeTestPreset()`](/repobuddy/vitest/reference/node-test-preset/)
- [`@repobuddy/vitest/setup/browser`](/repobuddy/vitest/reference/setup-browser/)
- [Test file names](/repobuddy/vitest/reference/test-file-names/)
