import { describe, expect, it } from '@jest/globals'
import { toPackageName } from './packageSpecifier.js'

describe(`${toPackageName.name}()`, () => {
	it('returns the specifier when it is a bare package name', () => {
		expect(toPackageName('ts-jest')).toEqual('ts-jest')
	})

	it('strips the subpath from a package specifier', () => {
		expect(toPackageName('jest-watch-typeahead/filename')).toEqual('jest-watch-typeahead')
	})

	it('keeps the scope of a scoped package', () => {
		expect(toPackageName('@swc/jest')).toEqual('@swc/jest')
	})

	it('strips the subpath from a scoped package specifier', () => {
		expect(toPackageName('@repobuddy/jest/presets/ts')).toEqual('@repobuddy/jest')
	})

	it.each(['./setup.ts', '../setup.ts', '/abs/setup.ts', '<rootDir>/setup.ts'])('skips the path %s', (specifier) => {
		expect(toPackageName(specifier)).toBeUndefined()
	})

	it('skips a regex replacement', () => {
		expect(toPackageName('$1')).toBeUndefined()
	})

	it('skips a node builtin', () => {
		expect(toPackageName('node:path')).toBeUndefined()
	})

	it('skips an empty specifier', () => {
		expect(toPackageName('')).toBeUndefined()
	})

	it('skips a scope without a package name', () => {
		expect(toPackageName('@swc')).toBeUndefined()
	})
})
