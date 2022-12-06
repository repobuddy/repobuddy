# Contributing Guide

## Prerequisites

This repository uses [pnpm].

The best way to get [pnpm] is by enabling [corepack]:

```sh
# install corepack for Node.js before 14.19.0 and 16.9.0 to use pnpm
npm install -g corepack

# enable pnpm with corepack
corepack enable

# or install pnpm directly
npm install -g pnpm
```

## Setup

This repository dogfooding itself.
So when you first step your environment,
please run `pnpm build` first.

```sh
# install dependency
pnpm install

# initial build
pnpm build
```

[pnpm]: https://pnpm.io/
[corepack]: https://nodejs.org/api/corepack.html
