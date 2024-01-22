# @repobuddy/biome

[![NPM version][npm-image]][npm-url]
[![NPM downloads][downloads-image]][downloads-url]

Repo buddy for [biome].

## Install

```sh
npm install -D @repobuddy/biome

yarn add -D @repobuddy/biome

pnpm add -D @repobuddy/biome
```

## Usage

Currently, [biome]'s extend mechanism only support relative path:

```jsonc
// biome.json
{
  "extends": [
    "./node_modules/@repobuddy/biome/recommended.json"
  ]
}

```

[biome]: https://biomejs.dev
[downloads-image]: https://img.shields.io/npm/dm/@repobuddy/biome.svg?style=flat
[downloads-url]: https://npmjs.org/package/@repobuddy/biome
[npm-image]: https://img.shields.io/npm/v/@repobuddy/biome.svg?style=flat
[npm-url]: https://npmjs.org/package/@repobuddy/biome
