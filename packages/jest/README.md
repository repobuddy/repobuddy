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
- `@repobuddy/jest/presets/js-esm`

Each preset also exposes the config they use, so you can override part of the config as needed:

```js
import { tsEsm } from '@repobuddy/jest/presets/ts-esm'

export default {
  preset: '@repobuddy/jest/presets/ts-esm',
  moduleNameMapper: {
    ...tsEsm.moduleNameMapper,
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

[@repobuddy/jest]: https://github.com/repobuddy/jest
