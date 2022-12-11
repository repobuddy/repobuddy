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
- `@repobuddy/jest/presets/ts-cjs-watch`
- `@repobuddy/jest/presets/ts-esm`
- `@repobuddy/jest/presets/ts-esm-watch`
- `@repobuddy/jest/presets/js-cjs`
- `@repobuddy/jest/presets/js-cjs-watch`
- `@repobuddy/jest/presets/js-esm-watch`

If you do not have any specific configs,
these presets should work without additional configuration.

Here are some highlights:

- all of the presets will automatically detects your source folder.
- `cjs` uses `jest-esm-transformer-2` to transforms ESM dependencies.
- `watch` uses these plugins by default:
  - `jest-watch-suspend`
  - `jest-watch-typeahead`
  - `jest-watch-toggle-config-2`

Since your project will only use a specific config,
none of these packages are marked as required peer dependencies.
You will need to add them to your project manually.

There will be a CLI tool in the future to help simplify that. Contribution welcome! 🍺

## Configs

The configurations for specific use cases are exposed and available for you to compose the exact config that you need.

They can be predefined configs:

- [node](./ts/configs/node.ts)
- [electron](./ts/configs/electron.ts)
- [electronRenderer](./ts/configs/electron.ts)
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

There are also matchers which you can use to extends the `expect()` function:

- [toSatisfies](./ts/matchers/toSatisfies.ts): Similar functionality provided by [assertron](https://github.com/unional/assertron) and [satisfier](https://github.com/unional/satisfier)

Use `expect.extend({ toSatisfier })` to add it to your `expect()` function.

You can also do `import '@repobuddy/jest/matchers'` in your setup to import them automatically.

## Notes about Jest configs

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
