---
title: nodeTestPreset()
description: A Vite plugin that configures Vitest to run tests in Node.js or a simulated DOM.
---

`nodeTestPreset()` returns a Vite plugin named `@repobuddy/vitest/node-preset` that sets the Vitest `test` config for
Node.js, jsdom, happy-dom, or edge-runtime tests.

## Usage

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import { nodeTestPreset } from '@repobuddy/vitest/config/node'

export default defineConfig({
	plugins: [nodeTestPreset()],
})
```

```ts
function nodeTestPreset(options?: {
	includeGeneralTests?: boolean | undefined
	includeLoadTests?: boolean | undefined
	environment?: 'node' | 'jsdom' | 'happy-dom' | 'edge-runtime' | (string & {}) | undefined
}): Plugin
```

Import it from `@repobuddy/vitest/config/node` or `@repobuddy/vitest/config`. The options type is not exported; use
`Parameters<typeof nodeTestPreset>[0]` if you need it.

## Options

| Option | Type | Default | Effect |
| --- | --- | --- | --- |
| `includeGeneralTests` | `boolean` | `false` | Adds `buddyConfigDefaults.include.testGeneral` (for example `a.spec.ts`) to `test.include` |
| `includeLoadTests` | `boolean` | `false` | Adds `buddyConfigDefaults.include.testLoad` (`a.load.ts`) to `test.include` |
| `environment` | `'node' \| 'jsdom' \| 'happy-dom' \| 'edge-runtime' \| string` | `'node'` | Sets `test.environment`. `'jsdom'` and `'happy-dom'` also add `buddyConfigDefaults.include.testBrowser`. |

## Effective config

The plugin's `config()` hook returns this `test` config with no options:

```json
{
	"expect": { "poll": { "timeout": 5000 } },
	"server": { "deps": { "fallbackCJS": true } },
	"testTimeout": 30000,
	"include": [
		"{src,source,code,tests}/**/*.{spec,test,unit,accept,integrate,system,perf,stress,study}.node*.{js,cjs,mjs,ts,cts,mts}"
	],
	"environment": "node",
	"coverage": {
		"include": ["{src,source,code}/**/*.{js,mjs,cjs,ts,jsx,tsx,cts,mts}"],
		"exclude": [
			"**/*.{spec,test,unit,accept,integrate,system,perf,stress,study,load}.{js,jsx,cjs,mjs,ts,tsx,cts,mts}",
			"**/*.{spec,test,unit,accept,integrate,system,perf,stress,study,load}.*.{js,jsx,cjs,mjs,ts,tsx,cts,mts}",
			"**/*.stories.{js,mjs,jsx,tsx}"
		]
	}
}
```

The options change only `test.include` and `test.environment`. `test.include` is built in this order:

| Options | `test.include` | `test.environment` |
| --- | --- | --- |
| none | `testNode` | `'node'` |
| `includeGeneralTests: true` | `testNode`, `testGeneral` | `'node'` |
| `includeLoadTests: true` | `testNode`, `testLoad` | `'node'` |
| `environment: 'jsdom'` | `testNode`, `testBrowser` | `'jsdom'` |
| `environment: 'happy-dom'` | `testNode`, `testBrowser` | `'happy-dom'` |
| `environment: 'edge-runtime'` | `testNode` | `'edge-runtime'` |

All options together give `testNode`, `testGeneral`, `testLoad`, then `testBrowser` (for jsdom or happy-dom). The
names refer to the globs in [`buddyConfigDefaults.include`](/repobuddy/vitest/reference/buddy-config-defaults/).

## Behavior

- The hook sets `process.env.TZ` to `GMT` when `TZ` is not already set, so date output is the same on every machine.
  A `TZ` you set yourself is kept.
- The plugin runs in Vite's normal phase (no `enforce`).
- Vitest needs the package for a non-`node` environment installed, for example `jsdom` or `happy-dom`.
- `edge-runtime` and any other environment string do not add the browser test globs.
- In a Vitest projects setup, Vitest reads `coverage` from the root config only, so the preset's `coverage` has no
  effect there. Set it in the root config. See [Node.js and browser tests together](/repobuddy/vitest/guides/node-and-browser/).

### Your config and the preset

Vite merges the plugin's result on top of your config:

- Arrays are concatenated. A `test.include` you set is kept, and the preset's globs are added after it.
- Other values from the preset replace yours. A `test.environment` or `test.testTimeout` in the same config has no
  effect. Use the `environment` option instead.

To override a preset value, add a plugin after the preset:

```ts
export default defineConfig({
	plugins: [
		nodeTestPreset(),
		{ name: 'override-timeout', config: () => ({ test: { testTimeout: 1000 } }) },
	],
})
```

## Examples

Run Node.js and general tests:

```ts
export default defineConfig({
	plugins: [nodeTestPreset({ includeGeneralTests: true })],
})
```

Run browser test files in jsdom:

```ts
export default defineConfig({
	plugins: [nodeTestPreset({ environment: 'jsdom' })],
})
```

## Related

- [Run Node.js tests](/repobuddy/vitest/guides/node-tests/)
- [`browserTestPreset()`](/repobuddy/vitest/reference/browser-test-preset/)
- [Test file names](/repobuddy/vitest/reference/test-file-names/)
- [`buddyConfigDefaults`](/repobuddy/vitest/reference/buddy-config-defaults/)
