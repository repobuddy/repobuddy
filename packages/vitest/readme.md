# @repobuddy/vitest

[![NPM version][npm-image]][npm-url]
[![NPM downloads][downloads-image]][downloads-url]

[@repobuddy/vitest] provides tools and utilities to take care of [Vitest] stuffs so you don't have to.

## Install

```sh
# npm
npm install -D @repobuddy/vitest

# yarn
yarn add -D @repobuddy/vitest

# pnpm
pnpm install -D @repobuddy/vitest

#rush
rush add -p --dev @repobuddy/typescript
```

## presets

[@repobuddy/vitest] provides a set of [tsconfigs] that you can use in your project.

- `@repobuddy/vitest/tsconfig/monorepo`: for monorepo projects.
- `@repobuddy/vitest/tsconfig/legacy/monorepo`: for monorepo projects using TypeScript < 5.0\
  including `astro` project which uses `tsconfig-resolver` (<https://github.com/withastro/astro/issues/6918>).

There are individual configs available for you to compose your own config.
For more information, see [tsconfig](./tsconfig/readme.md).

## Notes

The `verbatimModuleSyntax` setting should be enabled for `Node16`.
But it is disabled currently due to some issue with `ts-jest`:

```sh
error TS1286: ESM syntax is not allowed in a CommonJS module when 'verbatimModuleSyntax' is enabled.
```

It seems like somehow it is treated as CommonJS while it is not (setting `useESM` to `true`).

## buddy CLI

- 🐤 `buddy ts build cjs` (in beta)
- 🐤 `buddy ts build tslib` (in beta)
- 🚧 `buddy ts init`
- 🚧 `buddy ts up`

[@repobuddy/typescript]: ./README.md
[downloads-image]: https://img.shields.io/npm/dm/@repobuddy/typescript.svg?style=flat
[downloads-url]: https://npmjs.org/package/@repobuddy/typescript
[npm-image]: https://img.shields.io/npm/v/@repobuddy/typescript.svg?style=flat
[npm-url]: https://npmjs.org/package/@repobuddy/typescript
[typescript]: https://typescriptlang.org/
