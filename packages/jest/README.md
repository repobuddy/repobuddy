# @repobuddy/jest

[@repobuddy/jest] provides tools and utilities to manage your [jest] usage so you don't have to.

## Install

```sh
# npm
npm install -D @repobuddy/jest

# yarn
yarn add -D @repobuddy/jest

# pnpm
pnpm add -D @repobuddy/jest

# rush
rush add -p @repobuddy/jest --dev
```

## Presets

[@repobuddy/jest] comes with a few presets:

- `@repobuddy/jest/presets/ts-cjs`
- `@repobuddy/jest/presets/ts-esm`
- `@repobuddy/jest/presets/js-cjs`
- `@repobuddy/jest/presets/js-esm`

Each preset also exposes the config they use, so you can override part of the config as needed:

```js
// jest.config.mjs
import { tsEsmPreset } from '@repobuddy/jest'

export default {
  preset: '@repobuddy/jest/presets/ts-esm',
  moduleNameMapper: {
    ...tsEsmPreset.moduleNameMapper,
    // your additional config
  }
}
```

```js
// jest.config.cjs
const { tsEsmPreset } = require('@repobuddy/jest')

module.exports = {
  ...preset,
  moduleNameMapper: {
    ...tsEsmPreset.moduleNameMapper,
    // your additional config
  }
}
```

## Configs

Every config are exposed so you can compose them as needed:

```js
import { nodejs, watch, ... } from '@repobuddy/jest'

export default {
  ...nodejs,
  ...watch
}
```

## Specific Jest configs

### `transformIgnorePatterns`

[jest] could not understands ESM code.
And by default, the code under `node_modules` are not transformed.

To work with packages that are distributed as ESM,
one workaround is to use negative regex match in [transformIgnorePatterns] so that `jest` will actually transpile them.

However, it does not work with all package managers.
For example, it doesn't work with monorepo using [pnpm].
(the example in [jest] docs only works for simple repo using [pnpm])

Therefore, for simplicity, [@repobuddy/jest] uses [jest-esm-transformer-2] to handle that and keep [transformIgnorePatterns] empty.

[@repobuddy/jest]: https://github.com/repobuddy/jest
[jest]: https://jestjs.io
[transformIgnorePatterns]: https://jestjs.io/docs/configuration#transformignorepatterns-arraystring
[pnpm]: https://pnpm.io/
