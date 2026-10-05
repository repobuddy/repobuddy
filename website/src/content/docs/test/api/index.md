---
title: API
description: Every export of @repobuddy/test.
---

All exports come from the package root:

```ts
import { installOrder, isRunningInTest, order } from '@repobuddy/test'
```

| Export | Kind | Purpose | Page |
| --- | --- | --- | --- |
| `installOrder(expect)` | function | Adds `expect.order` to a runner's `expect` | [installOrder](/repobuddy/test/api/install-order/) |
| `order` | value | The `OrderApi` that `installOrder` attaches | [installOrder](/repobuddy/test/api/install-order/#order) |
| `isRunningInTest()` | function | Whether the code runs under a test runner | [isRunningInTest](/repobuddy/test/api/is-running-in-test/) |
| `AssertOrder` | class | Re-exported from `assertron` | [Types](/repobuddy/test/api/types/#assertorder) |
| `InvalidOrder` | class | Re-exported from `assertron` | [Types](/repobuddy/test/api/types/#invalidorder) |
| `OrderApi` | type | `{ plan(steps?: number): AssertOrder }` | [Types](/repobuddy/test/api/types/#orderapi) |
| `ExpectWithOrder` | type | `{ order: OrderApi }` | [Types](/repobuddy/test/api/types/#expectwithorder) |
