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

### Load tests

Load tests (`*.load.ts`, `*.load.js`) are recognized as test files,
but are excluded from a normal run because they are slow.

Opt into them with `includeLoadTests`, or give them their own config:

```ts
// vitest.config.load.ts
import { defineConfig } from 'vitest/config'
import { buddyConfigDefaults, nodeTestPreset } from '@repobuddy/vitest/config/node'

export default defineConfig({
  plugins: [nodeTestPreset()],
  test: { include: buddyConfigDefaults.include.testLoad },
})
```

[downloads-image]: https://img.shields.io/npm/dm/@repobuddy/typescript.svg?style=flat
[downloads-url]: https://npmjs.org/package/@repobuddy/typescript
[npm-image]: https://img.shields.io/npm/v/@repobuddy/typescript.svg?style=flat
[npm-url]: https://npmjs.org/package/@repobuddy/typescript
