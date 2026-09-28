# @repobuddy/vitest

[![NPM version][npm-image]][npm-url]
[![NPM downloads][downloads-image]][downloads-url]

[@repobuddy/vitest] provides tools and utilities to take care of [Vitest] stuffs, so you don't have to.

## Install

```sh
# npm
npm install -D @repobuddy/vitest

# yarn
yarn add -D @repobuddy/vitest

# pnpm
pnpm install -D @repobuddy/vitest

#rush
rush add -p --dev @repobuddy/vitest
```

## Features

- Provides test presets for Node.js and browser environments
  - `nodeTestPreset`: Configures Vitest for Node.js testing
  - `browserTestPreset`: Configures Vitest for browser testing using Playwright
- Includes common test configurations and defaults
- Sets timezone to GMT and automatically restores mocks after tests
- Provides better config defaults such as test file patterns and coverage configurations
- Disables screenshot on failure in browser tests to avoid Storybook loading issues
- Adds `expect.order` for asserting execution order via `@repobuddy/vitest/setup/order`

## Usage

```ts
// vitest.config.node.ts
import { defineConfig } from 'vitest/config'
import { nodeTestPreset } from '@repobuddy/vitest/config/node'

export default defineConfig({
  plugins: [nodeTestPreset({ includeGeneralTests: true })],
})


// vitest.config.browser.ts
import { defineConfig } from 'vitest/config'
import { browserTestPreset } from '@repobuddy/vitest/config/browser'

export default defineConfig({
  plugins: [browserTestPreset()],
})
```

### `expect.order`

Add `@repobuddy/vitest/setup/order` to your setup files
to get `expect.order`, an [`AssertOrder`](https://github.com/cyberuni/assertron) factory
for asserting your code executes in the expected order:

```ts
// vitest.config.node.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
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

The setup file augments `vitest`'s `ExpectStatic`, so `expect.order` is typed with no extra wiring.

[downloads-image]: https://img.shields.io/npm/dm/@repobuddy/typescript.svg?style=flat
[downloads-url]: https://npmjs.org/package/@repobuddy/typescript
[npm-image]: https://img.shields.io/npm/v/@repobuddy/typescript.svg?style=flat
[npm-url]: https://npmjs.org/package/@repobuddy/typescript
