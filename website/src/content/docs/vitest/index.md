---
title: '@repobuddy/vitest'
description: Vitest presets for Node.js and browser tests, shared config defaults, and an expect.order setup file.
---

`@repobuddy/vitest` configures Vitest through Vite plugins. Add `nodeTestPreset()` for tests that run in Node.js or a
simulated DOM, and `browserTestPreset()` for tests that run in a real browser through Playwright.

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

Install the peers you need:

| Peer | Range | Needed by |
| --- | --- | --- |
| `vitest` | `^5.0.0` | everything |
| `@vitest/browser-playwright` | `^5.0.0` (optional) | `browserTestPreset()`, `@repobuddy/vitest/config/browser`, and `@repobuddy/vitest/config` |

## Choose an entry

| You want to | Use | Import from |
| --- | --- | --- |
| Run tests in Node.js, jsdom, happy-dom, or edge-runtime | [`nodeTestPreset()`](/repobuddy/vitest/reference/node-test-preset/) | `@repobuddy/vitest/config/node` |
| Run tests in a real browser through Playwright | [`browserTestPreset()`](/repobuddy/vitest/reference/browser-test-preset/) | `@repobuddy/vitest/config/browser` |
| Run both from one command, with one coverage report | Both presets as Vitest projects ([guide](/repobuddy/vitest/guides/node-and-browser/)) | both |
| Write a config by hand with the same globs and settings | [`buddyConfigDefaults`](/repobuddy/vitest/reference/buddy-config-defaults/) | `@repobuddy/vitest/config/node` |
| Assert that code runs in a given order | [`@repobuddy/vitest/setup/order`](/repobuddy/vitest/reference/setup-order/) | setup file |

See [Entry points](/repobuddy/vitest/reference/entry-points/) for every import path.

## Support

| Area | Supported |
| --- | --- |
| Vitest | `^5.0.0` only (peer dependency) |
| Browser provider | `@vitest/browser-playwright` `^5.0.0`, optional peer, needed only for browser tests |
| Node.js | No `engines` field is declared |
| Module format | ESM only (`"type": "module"`, every export has an `import` condition only) |
| Environments (`nodeTestPreset`) | `node` (default), `jsdom`, `happy-dom`, `edge-runtime`, or any other `test.environment` string |
| Browsers (`browserTestPreset`) | One headless Chromium instance by default. Set `test.browser.instances` to choose others the Playwright provider accepts (`chromium`, `firefox`, `webkit`). |
| TypeScript | The presets add no transform. Vitest's own transform applies. |
| Repository layout | Single package, or one Vitest project per preset in a root config with `test.projects` |
| Test file location | `src`, `source`, `code`, or `tests` ([Test file names](/repobuddy/vitest/reference/test-file-names/)) |

### Not supported

- Vitest 4 and earlier. Stay on `@repobuddy/vitest` 2.x to keep using Vitest 4.
- CommonJS `require()`. The package has no CommonJS build.
- Browser providers other than Playwright (for example WebdriverIO). `browserTestPreset()` always sets the
  Playwright provider and has no option to change it.
- Overriding a preset's `test` values from the same config. The preset's values win; see
  [`nodeTestPreset()`](/repobuddy/vitest/reference/node-test-preset/#your-config-and-the-preset).
- Installing browsers. Install Playwright's browsers yourself.
- Visual or screenshot testing. The package does not provide it.

## Next steps

- Guides: [Node.js tests](/repobuddy/vitest/guides/node-tests/), [Browser tests](/repobuddy/vitest/guides/browser-tests/),
  [Node.js and browser tests together](/repobuddy/vitest/guides/node-and-browser/),
  [Load tests](/repobuddy/vitest/guides/load-tests/), [Assert call order](/repobuddy/vitest/guides/expect-order/),
  [Migrate from Vitest 4](/repobuddy/vitest/guides/migrate-from-vitest-4/).
- [Reference](/repobuddy/vitest/reference/): every preset, export, and setup file.
