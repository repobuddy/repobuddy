# @repobuddy/test

[![NPM version][npm-image]][npm-url]
[![NPM downloads][downloads-image]][downloads-url]

[@repobuddy/test] provides basic test utilities.

You normally would access it through other packages,
for example, [@repobuddy/vitest](https://www.npmjs.com/package/@repobuddy/vitest).

## Install

```sh
# npm
npm install -D @repobuddy/test

# yarn
yarn add -D @repobuddy/test

# pnpm
pnpm install -D @repobuddy/test

#rush
rush add -p --dev @repobuddy/test
```

## `expect.order`

Assert your code executes in the expected order,
backed by [`AssertOrder`](https://github.com/cyberuni/assertron) from [assertron].

`installOrder(expect)` adds `order` to your test runner's `expect`.
`expect.order.plan(x)` then creates an `AssertOrder` planned for `x` steps:

```ts
import { installOrder } from '@repobuddy/test'
import { expect, it } from 'vitest'

installOrder(expect)

it('calls the callbacks in order', () => {
  const o = expect.order.plan(2)

  subject.on('start', () => o.once(1))
  subject.on('end', () => o.once(2))

  subject.run()

  o.end() // throws when the 2 planned steps were not all reached
})
```

`plan()` without an argument creates an unplanned `AssertOrder`.
The returned instance carries the whole `AssertOrder` surface:
`once`, `on`, `atLeastOnce`, `exactly`, `any`, `onAny`, `is`, `not`, `wait`, `end`, and the rest.

`installOrder()` does not know about your runner's types, so augment them yourself:

```ts
import type { ExpectWithOrder } from '@repobuddy/test'

declare module '@jest/expect' {
  interface Expect extends ExpectWithOrder {}
}
```

Using [@repobuddy/vitest]? It ships `@repobuddy/vitest/setup/order`,
which installs `order` and augments `vitest`'s types for you.

[downloads-image]: https://img.shields.io/npm/dm/@repobuddy/typescript.svg?style=flat
[downloads-url]: https://npmjs.org/package/@repobuddy/typescript
[npm-image]: https://img.shields.io/npm/v/@repobuddy/typescript.svg?style=flat
[npm-url]: https://npmjs.org/package/@repobuddy/typescript
[@repobuddy/vitest]: https://www.npmjs.com/package/@repobuddy/vitest
[assertron]: https://github.com/cyberuni/assertron
