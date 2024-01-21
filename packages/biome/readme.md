# @repobuddy/biome

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
