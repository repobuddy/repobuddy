import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parse } from '../src/parse.js'

test('parse("") throws a TypeError', () => {
	assert.throws(() => parse(''), TypeError)
})
