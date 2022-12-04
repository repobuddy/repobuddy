import { beforeAll, expect, it } from '@jest/globals'
import { toSatisfies } from '@repobuddy/jest/matchers'

beforeAll(() => expect.extend({ toSatisfies }))

it('add to expect', () => {
  expect(1).toSatisfies((x) => x === 1)
})
