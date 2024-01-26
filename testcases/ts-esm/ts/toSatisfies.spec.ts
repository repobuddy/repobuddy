import { beforeAll, expect, it } from '@jest/globals'
import { toSatisfies } from '@repobuddy/jest/matchers'
import { a } from 'assertron'
import stripAnsi from 'strip-ansi'

beforeAll(() => expect.extend({ toSatisfies }))
expect.extend({ toSatisfies })

it('adds to expect', () => {
	expect({ a: 1 }).toSatisfies({ a: (x) => x === 1 })
})

it('prints fail expectation', () => {
	const err = a.throws(() => expect({ a: 1 }).toSatisfies({ a: (x) => x === 2 }))
	expect(stripAnsi(err.message)).toEqual(`expect(received).toSatisfies()

expect 'a' to satisfy x => x === 2, but received 1`)
})

it('prints negative fail expectation', () => {
	const err = a.throws(() => expect({ a: 1 }).not.toSatisfies({ a: (x) => x === 1 }))
	expect(stripAnsi(err.message)).toEqual(`expect(received).not.toSatisfies()

received {"a": 1}`)
})
