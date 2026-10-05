---
title: matchers
description: The toSatisfies matcher, from the matchers namespace or the @repobuddy/jest/matchers entry.
---

`matchers` holds one Jest matcher, `toSatisfies`. It is on the main entry and on its own entry:

```ts
import { matchers } from '@repobuddy/jest'
import { toSatisfies } from '@repobuddy/jest/matchers'
```

Importing either entry does not register the matcher. Pass it to `expect.extend()`.

## toSatisfies

Passes when the received value satisfies an expectation, checked by
[`satisfier`](https://www.npmjs.com/package/satisfier).

```ts
function toSatisfies(this: any, actual: unknown, expectation: Expectation): {
	pass: boolean
	message: () => string
}
```

In a test you call it as `expect(actual).toSatisfies(expectation)`.

| Parameter | Type | Default | Effect |
| --- | --- | --- | --- |
| `expectation` | `Expectation` from `satisfier` | required | The value, regular expression, or predicate to check `actual` against. A property in an object expectation can be a predicate. |

Returns a Jest matcher result. On failure, the message lists each property that did not satisfy its expectation. On a
failing `.not`, the message prints the received value.

### Register it

```ts
import { expect } from '@jest/globals'
import { toSatisfies } from '@repobuddy/jest/matchers'

expect.extend({ toSatisfies })
```

To register it for every test file, put those lines in a file listed in `setupFilesAfterEnv`.

### Types

The package declares `toSatisfies` on `jest.Matchers` (for `@types/jest` globals) and on the `Matchers` interface of
`@jest/expect` (for `expect` from `@jest/globals`). Importing from `@repobuddy/jest/matchers` brings the declarations in.

### Examples

From the spec:

```ts
expect({ a: 1 }).toSatisfies({ a: (x) => x === 1 })
```

A failing check:

```ts
expect({ a: 1 }).toSatisfies({ a: (x) => x === 2 })
// expect(received).toSatisfies()
//
// expect 'a' to satisfy x => x === 2, but received 1
```

A failing `.not`:

```ts
expect({ a: 1 }).not.toSatisfies({ a: (x) => x === 1 })
// expect(received).not.toSatisfies()
//
// received {"a": 1}
```

The `ts-esm`, `ts-cjs`, `js-esm`, and `dual-ts-*` fixtures in this repository run the same checks through
`@repobuddy/jest/matchers`.

## Related

- [API index](/repobuddy/jest/api/)
