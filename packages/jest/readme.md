# @repobuddy/jest

[![NPM version][npm-image]][npm-url]
[![NPM downloads][downloads-image]][npm-url]
[![Codecov][codecov-image]][codecov-url]

[@repobuddy/jest] provides tools and utilities to manage your [jest] usage, so you don't have to.

Turn your config from this:

```ts
export default {
  collectCoverageFrom: ['<rootDir>/ts/**/*.{js,jsx,cjs,mjs,ts,tsx,cts,mts}'],
  coveragePathIgnorePatterns: [
    /* ... */
  ],
  extensionsToTreatAsEsm: ['.ts', '.tsx', '.mts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    /* ... and the ESM madness like `chalk` ... */
  },
  testEnvironment: 'node',
  testRegex: [
    /* ... */
  ],
  roots: ['<rootDir>/ts'],
  transform: {
    '^.+\\.(ts|tsx|cts|mts)$': ['ts-jest', [{
      isolatedModules: true,
      useESM: true,
      diagnostics: {
        // https://github.com/kulshekhar/ts-jest/issues/3820
        ignoreCodes: [151001]
      }
    }]],
    '\\.m?jsx?$': 'jest-esm-transformer-2',
    /* ... more ESM madness ... */
  },
  transformIgnorePatterns: [],
  watchPlugins: [
    'jest-watch-suspend',
    ['jest-watch-toggle-config-2', { setting: 'collectCoverage' }],
    ['jest-watch-toggle-config-2', { setting: 'verbose' }],
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ]
}
```

to this:

```ts
export default {
  preset: '@repobuddy/jest/presets/ts-esm-watch'
}
```

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

## Upgrading to `ts-jest` 29.2

If you are using `ts-jest` 29.2 or above,
you may run into the `Cannot use import statement outside a module` error.
For example:

```sh
/home/unional/code/repobuddy/repobuddy/packages/jest/ts/presets/ts-watch/jest-preset.spec.ts:1
({"Object.<anonymous>":function(module,exports,require,__dirname,__filename,jest){import { describe, expect, it } from '@jest/globals';
                                                                                  ^^^^^^

SyntaxError: Cannot use import statement outside a module
```

This is because `ts-jest` 29.2 adds support for `module: Node16/NodeNext`.

## Presets

[@repobuddy/jest] comes with many presets:

- `@repobuddy/jest/presets/ts`: auto-detect if your project is CJS or ESM
- `@repobuddy/jest/presets/ts-watch`: auto-detect if your project is CJS or ESM
- `@repobuddy/jest/presets/ts-cjs`
- `@repobuddy/jest/presets/ts-cjs-watch`
- `@repobuddy/jest/presets/ts-esm`
- `@repobuddy/jest/presets/ts-esm-watch`
- `@repobuddy/jest/presets/js-cjs`
- `@repobuddy/jest/presets/js-cjs-watch`
- `@repobuddy/jest/presets/js-esm`
- `@repobuddy/jest/presets/js-esm-watch`
- `@repobuddy/jest/presets/jsdom-ts`: auto-detect if your project is CJS or ESM
- `@repobuddy/jest/presets/jsdom-ts-watch`: auto-detect if your project is CJS or ESM
- `@repobuddy/jest/presets/jsdom-ts-cjs`
- `@repobuddy/jest/presets/jsdom-ts-cjs-watch`
- `@repobuddy/jest/presets/jsdom-ts-esm`
- `@repobuddy/jest/presets/jsdom-ts-esm-watch`
- `@repobuddy/jest/presets/watch`: watch mode presets for multienvironment config

If you do not have any specific configs,
these presets should work without additional configuration.

Here are some highlights:

- All presets will automatically detect your source folder (in either `src`, `source`, `ts`, or `js`).
- Support platform specific tests:
  - `feature.spec.node.ts`
  - `feature.spec.node16.ts`
  - `feature.spec.jsdom.ts`
  - The platform specifiers are placed after the test specifier (e.g. `spec`) to alloy more freedom in naming the feature.
- Uses [@repobuddy/jest/resolver] that handles [subpath imports][subpath-imports] correctly.
- `cjs` uses [jest-esm-transformer-2] to transforms ESM dependencies.
- `ts` uses [ts-jest] with `isolatedModule: true`.
- `watch` uses these plugins by default:
  - [jest-watch-suspend]
  - [jest-watch-toggle-config-2]
  - [jest-watch-typeahead]

Since your project will only use a specific config,
none of these packages are marked as required peer dependencies.
You will need to add them to your project manually.

There will be a CLI tool in the future to help simplify that. Contribution welcome! 🍺

If you want to make some adjustments based on a particular preset,
you can import the preset and customize it like so:

```ts
import preset from '@repobuddy/jest/presets/ts-esm-watch'

export default {
  preset: '@repobuddy/jest/presets/ts-esm-watch',
  moduleNameMapper: {
    ...preset.moduleNameMapper,
    // your customization
  }
}
```

Besides customizing your config manually,
[@repobuddy/jest] exposes everything it uses,
so you can compose and customize them exactly the way you like.

## Runners

[@repobuddy/jest] supports running [jest] in [Node.js][nodejs], and [jsdom].


## Configs

The configurations for specific use cases are exposed and available for you to compose the exact config that you need.

They can be predefined configs:

- [node](./ts/configs/node.ts)
- [jsdom](./ts/configs/jsdom.ts)
- [jsCjs](./ts/configs/javascript.ts)
- [jsEsm](./ts/configs/javascript.ts)
- [tsCjs](./ts/configs/typescript.ts)
- [tsEsm](./ts/configs/typescript.ts)

or functions prefixed with `config`:

- [configNode()](./ts/configs/node.ts)
- [configSource()](./ts/configs/configSource.ts)

## Fields

Fields are predefined fields or functions about a particular field of the [jest config](https://jestjs.io/docs/configuration).

They can be `define` functions, which provides type assistants to define the particular field:

- [defineTransform](./ts/fields/transform.ts)
- [defineWatchPlugins](./ts/fields/watchPlugins.ts)

They can be `known` configurations, which you can use to build your configuration easily:

- [knownExtensionsToTreatAsEsm](./ts/fields/extensionsToTrestAsEsm.ts)
- [knownRunners](./ts/fields/runner.ts)
- [knownTestEnvironments](./ts/fields/testEnvironment.ts)
- [knownTestEnvironmentOptions](./ts/fields/testEnvironment.ts)
- [knownTransforms](./ts/fields/transform.ts)
- [knownWatchPlugins](./ts/fields/watchPlugins.ts)

## Matchers

There are also matchers which you can use to extend the `expect()` function:

- [toSatisfies](./ts/matchers/toSatisfies.ts): Similar functionality provided by [assertron] and [satisfier]

Use `expect.extend({ toSatisfier })` to add it to your `expect()` function.

You can also do `import '@repobuddy/jest/matchers'` in your setup to import them automatically.

## Resolver

[@repobuddy/jest/resolver] fixes the ESM [subpath imports][subpath-imports] issue by using [resolve.imports].

So you don't need to do crazy hacks like:

```ts
export default {
  moduleNameMapper: {
    '#(.*)': '$1'  // and this actually doesn't work in some cases
  },
  transformIgnorePatterns: [
    'node_modules/(?!(chalk|#ansi-styles)/)'
  ]
}
```

or even

```ts
const path = require('node:path')

const chalk = require.resolve('chalk')
const chalkRootDir = chalk.slice(0, chalk.lastIndexOf('chalk'))

module.exports = {
  // ...
  moduleNameMapper: {
    chalk,
    '#ansi-styles': path.join(
      chalkRootDir,
      'chalk/source/vendor/ansi-styles/index.js',
    ),
    '#supports-color': path.join(
      chalkRootDir,
      'chalk/source/vendor/supports-color/index.js',
    )
  }
}
```

Now, all you need is:

```ts
export default {
  resolver: '@repobuddy/jest/resolver'
}
```

Or use one of the NodeJS presets!

## Notes

Here are some notes about [@repobuddy/jest] that you may find useful.

### `ts-jest`: `isolatedModules`

By default, all `ts` presets have `isolatedModules` set to `true`.

If you want to change that, you can override with the `knownTransforms.tsJest*()` functions:

```ts
import { knownTransforms } from '@repobuddy/jest'

export default {
  preset: '@repobuddy/jest/presets/ts-esm',
  transform: knownTransforms.tsJest(/* your option */)
}
```

While you may want the type checking benefits,
in my experience it is ok to break the types when you are in the middle of your code,
e.g. when you are doing TDD.

I would recommend using the build process and IDE to help you to catch any type errors,
while allowing the type to break while writing code and tests.

The tighter feedback loop makes it much easier to work with.

This also avoid getting the bad habit of marking things `any` along the way,
just to silents the type checker.

Writing the correct type is not an easy task,
and it is better to leave at the refactoring stage IMO.

### `transformIgnorePatterns`

[jest] could not understand ESM code.
And by default, the code under `node_modules` are not transformed.

To work with packages that are distributed as ESM,
one workaround is to use negative regex match in [transformIgnorePatterns] so that `jest` will actually transpile them.

However, it does not work with all package managers.
For example, it doesn't work with monorepo using [pnpm].
(the example in [jest docs][transformIgnorePatterns] only works for simple repo using [pnpm])

Therefore, for simplicity, [@repobuddy/jest] uses [jest-esm-transformer-2] to handle that and keep [transformIgnorePatterns] empty.

### About the `exports` field

You may wonder why there are:

```js
{
  "./presets/ts": {
    "types": "./esm/presets/ts/jest-preset.d.ts",
    "import": "./esm/presets/ts/jest-preset.js",
    "default": "./cjs/presets/ts/jest-preset.js"
  },
  "./presets/ts/jest-preset": {
    "types": "./esm/presets/ts/jest-preset.d.ts",
    "import": "./esm/presets/ts/jest-preset.js",
    "default": "./cjs/presets/ts/jest-preset.js"
  },
}
```

and `/packages/jest/presets/ts` files.

The `.../ts` export is needed to export the code and type correctly in TypeScript/JavaScript.
The `.../ts/jest-preset` export is need by `jest` to work correctly in Linux environment,
and the `/packages/jest/presets/ts` is needed to work in Windows environment (or CJS).

🤦

[@repobuddy/jest]: https://github.com/repobuddy/jest
[@repobuddy/jest/resolver]: ./ts/resolver.ts
[assertron]: https://github.com/unional/assertron
[codecov-image]: https://codecov.io/gh/repobuddy/jest/branch/main/graph/badge.svg
[codecov-url]: https://codecov.io/gh/repobuddy/jest
[downloads-image]: https://img.shields.io/npm/dm/@repobuddy/jest.svg?style=flat
[jest-esm-transformer-2]: https://www.npmjs.com/package/jest-esm-transformer-2
[jest-watch-suspend]: https://www.npmjs.com/package/jest-watch-suspend
[jest-watch-toggle-config-2]: https://www.npmjs.com/package/jest-watch-toggle-config-2
[jest-watch-typeahead]: https://www.npmjs.com/package/jest-watch-typeahead
[jest]: https://jestjs.io
[npm-image]: https://img.shields.io/npm/v/@repobuddy/jest.svg?style=flat
[npm-url]: https://npmjs.org/package/@repobuddy/jest
[pnpm]: https://pnpm.io/
[resolve.imports]: https://github.com/cyberuni/resolve.imports
[satisfier]: https://github.com/unional/satisfier
[subpath-imports]: https://nodejs.org/api/packages.html#subpath-imports
[transformIgnorePatterns]: https://jestjs.io/docs/configuration#transformignorepatterns-arraystring
[ts-jest]: https://www.npmjs.com/package/ts-jest
[jsdom]: https://github.com/jsdom/jsdom
[nodejs]: https://nodejs.org/en/
