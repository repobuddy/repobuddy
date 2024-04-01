# @repobuddy/biome

[![NPM version][npm-image]][npm-url]
[![NPM downloads][downloads-image]][downloads-url]

Repository buddy for [biome].

## Install

```sh
npm install -D @repobuddy/biome

yarn add -D @repobuddy/biome

pnpm add -D @repobuddy/biome
```

## Usage

Using [@repobuddy/biome] provided recommended config:

```jsonc
// biome.json
{
  "extends": ["@repobuddy/biome"],
  // ...
}
```

The recommended config is customized for people or teams that are proficient.

i.e., you know what you are doing. The tools try to help but get out of your way.

### `performant.json`

If performance is a top priority for your project,
some typical linting rules will hold you back.

This `performant` will have those rules disabled for you.

```jsonc
// biome.json
{
  "extends": ["@repobuddy/biome/performant"],
  // ...
}
```

[@repobuddy/biome]: https://www.npmjs.com/package/@repobuddy/biome
[biome]: https://biomejs.dev
[downloads-image]: https://img.shields.io/npm/dm/@repobuddy/biome.svg?style=flat
[downloads-url]: https://npmjs.org/package/@repobuddy/biome
[npm-image]: https://img.shields.io/npm/v/@repobuddy/biome.svg?style=flat
[npm-url]: https://npmjs.org/package/@repobuddy/biome
