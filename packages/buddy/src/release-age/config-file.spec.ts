import assert from 'node:assert/strict'
import { test } from '@jest/globals'
import { insertEntry, readExemptions, toMinutes, yamlBlock } from './config-file.js'

test('toMinutes: duration unmatched, bare number defaults to minutes, invalid non-duration is NaN', () => {
	assert.equal(toMinutes('yarn', 'not-a-duration'), undefined)
	assert.equal(toMinutes('yarn', '5'), 5)
	assert.equal(toMinutes('pnpm', 'abc'), undefined)
})

test('readExemptions: an entry on the very first line has no preceding marker', () => {
	const entries = readExemptions('pnpm', ['minimumReleaseAgeExclude:', `  - 'a'`])
	assert.equal(entries[0]?.until, null)
})

test('readExemptions: yaml block with a non-matching line inside is skipped', () => {
	const entries = readExemptions('pnpm', [
		'minimumReleaseAgeExclude:',
		`  - 'a'`,
		'  # a stray comment, not an item',
		`  - 'b'`,
	])
	assert.deepEqual(
		entries.map((e) => e.value),
		['a', 'b'],
	)
})

test('readExemptions: toml array with a non-matching line inside is skipped', () => {
	const entries = readExemptions('bun', [
		'[install]',
		'minimumReleaseAgeExcludes = [',
		'  "a",',
		'  # not quoted',
		'  "b",',
		']',
	])
	assert.deepEqual(
		entries.map((e) => e.value),
		['a', 'b'],
	)
})

test('yamlBlock: trailing blank lines after the block are excluded from its range', () => {
	const block = yamlBlock(['minimumReleaseAgeExclude:', '  - a', '', '', 'other: 1'], 'minimumReleaseAgeExclude')
	assert.equal(block?.end, 2)
})

test('insertEntry: ini format on a config with no lines matching the exclude key still appends', () => {
	const lines = ['min-release-age=2']
	insertEntry('npm', lines, 'foo', 'min-release-age: lift foo until x')
	assert.deepEqual(lines, ['min-release-age=2', '# min-release-age: lift foo until x', 'min-release-age-exclude[]=foo'])
})

test('insertEntry: toml, content before any [install] section (inside=false) still finds nothing and creates one', () => {
	const lines = ['# a leading comment', 'other = 1']
	insertEntry('bun', lines, 'foo', 'min-release-age: lift foo until x')
	assert.deepEqual(lines, [
		'# a leading comment',
		'other = 1',
		'',
		'[install]',
		'minimumReleaseAgeExcludes = [',
		'  # min-release-age: lift foo until x',
		'  "foo",',
		']',
	])
})

test('insertEntry: toml array trailing item already has a trailing comma', () => {
	const lines = ['[install]', 'minimumReleaseAgeExcludes = [', '  "foo",', ']']
	insertEntry('bun', lines, 'bar', 'min-release-age: lift bar until x')
	assert.deepEqual(lines, [
		'[install]',
		'minimumReleaseAgeExcludes = [',
		'  "foo",',
		'  # min-release-age: lift bar until x',
		'  "bar",',
		']',
	])
})

test('insertEntry: toml array whose last line is blank/comment before the closing bracket', () => {
	const lines = ['[install]', 'minimumReleaseAgeExcludes = [', '  "foo"', '  # trailing comment', ']']
	insertEntry('bun', lines, 'bar', 'min-release-age: lift bar until x')
	assert.match(
		lines.join('\n'),
		/"foo",?\n {2}# trailing comment\n {2}# min-release-age: lift bar until x\n {2}"bar",\n\]/,
	)
})

test('insertEntry: yaml block with no lines after key on the same line still appends into empty file end', () => {
	const lines: string[] = []
	insertEntry('pnpm', lines, 'foo', 'min-release-age: lift foo until x')
	assert.deepEqual(lines, ['minimumReleaseAgeExclude:', '  # min-release-age: lift foo until x', "  - 'foo'"])
})
