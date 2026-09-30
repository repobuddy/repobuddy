import { describe, expect, it } from '@jest/globals'
import { groupFixtureFiles, rootRelativePatterns } from './fixtures.js'

describe('groupFixtureFiles', () => {
	it('groups files by the outermost fixture or vendored folder', () => {
		expect(
			groupFixtureFiles([
				'src/a.ts',
				'testcases/x/package.json',
				'testcases/y/fixtures/z.json',
				'packages/a/__fixtures__/b.json',
				'go/vendor/lib.go',
				'third_party/c.js',
				'src/vendor.ts',
			]),
		).toEqual(
			new Map([
				['testcases/', ['testcases/x/package.json', 'testcases/y/fixtures/z.json']],
				['packages/a/__fixtures__/', ['packages/a/__fixtures__/b.json']],
				['go/vendor/', ['go/vendor/lib.go']],
				['third_party/', ['third_party/c.js']],
			]),
		)
	})
})

describe('rootRelativePatterns', () => {
	it('keeps a root ignore file as written, without comments and blank lines', () => {
		expect(rootRelativePatterns('# search\n\nfixtures/\n!keep.json\n', '')).toEqual(['fixtures/', '!keep.json'])
	})

	it('anchors a nested file’s patterns to its folder', () => {
		expect(rootRelativePatterns('fixtures/\n/vendor\na/b\n!c', 'pkg/a')).toEqual([
			'/pkg/a/**/fixtures/',
			'/pkg/a/vendor',
			'/pkg/a/a/b',
			'!/pkg/a/**/c',
		])
	})
})
