---
title: '@repobuddy/vitest'
description: Vitest presets for Node.js and browser tests, shared config defaults, and an expect.order setup file.
---

`@repobuddy/vitest` configures Vitest through a Vite plugin. Add `nodeTestPreset()` for tests that run in Node.js
or a simulated DOM, and `browserTestPreset()` for tests that run in a real browser through Playwright.

## Install

```sh
# npm
npm install -D @repobuddy/vitest

# yarn
yarn add -D @repobuddy/vitest

# pnpm
pnpm add -D @repobuddy/vitest

# rush
rush add -p --dev @repobuddy/vitest
```

| Peer | Range | Needed by |
| --- | --- | --- |
| `vitest` | `^4.0.15` | everything |
| `@vitest/browser-playwright` | `^4.0.15` | `browserTestPreset` and the `@repobuddy/vitest/config` entry (optional peer) |

The package is ESM only.

## Usage

Keep one config per environment:

```ts
// vitest.config.node.ts
import { defineConfig } from 'vitest/config'
import { nodeTestPreset } from '@repobuddy/vitest/config/node'

export default defineConfig({
	plugins: [nodeTestPreset({ includeGeneralTests: true })],
})
```

```ts
// vitest.config.browser.ts
import { defineConfig } from 'vitest/config'
import { browserTestPreset } from '@repobuddy/vitest/config/browser'

export default defineConfig({
	plugins: [browserTestPreset()],
})
```

Then run them from one root config with Vitest projects. Vitest reads `coverage` from the root config only, so set it
there:

```ts
// vitest.config.ts
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

## Entry points

| Import | Exports |
| --- | --- |
| `@repobuddy/vitest/config/node` | `nodeTestPreset`, `buddyConfigDefaults`, `mergeConfig` |
| `@repobuddy/vitest/config/browser` | `browserTestPreset`, `buddyConfigDefaults`, `mergeConfig` |
| `@repobuddy/vitest/config` | Everything from both. It loads `@vitest/browser-playwright`, so prefer `config/node` in a Node-only project. |
| `@repobuddy/vitest/setup/order` | Setup file that adds `expect.order` |
| `@repobuddy/vitest/setup/browser` | Setup file that `browserTestPreset` adds for you |
| `@repobuddy/vitest` | Re-exports [`@repobuddy/test`](/repobuddy/reference/test/) |

## Test file names

Tests live under `src`, `source`, `code`, or `tests`. A test file is `<name>.<id>.<ext>`, where `<id>` is one of `spec`,
`test`, `unit`, `accept`, `integrate`, `system`, `perf`, `stress`, or `study`. A platform segment after the id decides
which preset runs it:

| File | Example | Run by |
| --- | --- | --- |
| general | `a.spec.ts` | either preset, with `includeGeneralTests` |
| Node.js | `a.spec.node.ts` | `nodeTestPreset` |
| browser | `a.spec.browser.ts`, `a.spec.tsx` | `browserTestPreset`, or `nodeTestPreset` with `environment: 'jsdom'` or `'happy-dom'` |
| load | `a.load.ts` | either preset, with `includeLoadTests` |

Coverage includes `{src,source,code}/**` and excludes test files, load files, and `*.stories.*`.

## `nodeTestPreset(options?)`

Returns a Vite plugin named `@repobuddy/vitest/node-preset`.

| Option | Type | Default | Effect |
| --- | --- | --- | --- |
| `includeGeneralTests` | `boolean` | `false` | Also run general test files |
| `includeLoadTests` | `boolean` | `false` | Also run load test files |
| `environment` | `'node' \| 'jsdom' \| 'happy-dom' \| 'edge-runtime' \| string` | `'node'` | Sets `test.environment`. `jsdom` and `happy-dom` also run browser test files. |

The preset sets `process.env.TZ` to `GMT` when `TZ` is not already set, so date output is the same on every machine.

## `browserTestPreset(options?)`

Returns a Vite plugin named `@repobuddy/vitest/browser-preset`. It takes `includeGeneralTests` and
`includeLoadTests`, with the same meaning as above.

It enables browser mode, headless, with the Playwright provider. Unless your config sets `test.browser.instances`, it
adds one Chromium instance with `screenshotFailures: false`. It also registers `@repobuddy/vitest/setup/browser`, which
makes `Intl.DateTimeFormat().resolvedOptions().timeZone` report `GMT` and restores all mocks after the run.

Install the Playwright browsers yourself, for example with `npx playwright install chromium`.

## `buddyConfigDefaults`

Both presets apply these `test` settings:

| Setting | Value | Why |
| --- | --- | --- |
| `testTimeout` | `30000` | |
| `expect.poll.timeout` | `5000` | Vitest's 1000 ms default is too short for browser tests on CI |
| `server.deps.fallbackCJS` | `true` | Lets Vitest use the CommonJS build of a package without ESM |

`buddyConfigDefaults.include` holds the globs above as `source`, `testGeneral`, `testNode`, `testBrowser`, and
`testLoad`, plus Vitest's own as `vitestDefault`. `buddyConfigDefaults.exclude` holds `test` and `vitestDefault`. Use
them when you write a config by hand.

## `mergeConfig(base, overrides, isRoot?)`

Vitest's `mergeConfig`, typed to return `base & overrides`. Values in `overrides` win.

## Load tests

Load tests are slow, so keep them in their own config and run it on demand:

```ts
// vitest.config.load.ts
import { defineConfig } from 'vitest/config'
import { nodeTestPreset } from '@repobuddy/vitest/config/node'

export default defineConfig({
	plugins: [nodeTestPreset({ includeLoadTests: true })],
})
```

## `expect.order`

Add the setup file to get `expect.order`, which asserts that code runs in the order you expect:

```ts
// vitest.config.node.ts
import { defineConfig } from 'vitest/config'
import { nodeTestPreset } from '@repobuddy/vitest/config/node'

export default defineConfig({
	plugins: [nodeTestPreset()],
	test: { setupFiles: ['@repobuddy/vitest/setup/order'] },
})
```

```ts
it('calls the callbacks in order', () => {
	const o = expect.order.plan(2)

	subject.on('start', () => o.once(1))
	subject.on('end', () => o.once(2))

	subject.run()

	o.end() // throws when the 2 planned steps were not all reached
})
```

The setup file types `expect.order` for you. See [`@repobuddy/test`](/repobuddy/reference/test/) for the API.

## Related

- [`@repobuddy/test`](/repobuddy/reference/test/): `expect.order` for any test runner.
- [`repobuddy`](/repobuddy/reference/repobuddy/): `buddy test-scripts` writes the `test` and `coverage` scripts.
- [Packages overview](/repobuddy/reference/packages/): every package in the repository.
