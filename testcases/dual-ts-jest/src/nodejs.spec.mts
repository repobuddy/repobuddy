import { filename } from 'dirname-filename-esm'
import { testType } from 'type-plus/testing'

it(`${filename(import.meta)} executed`, () => {})

it('pure ESM', () => {
	testType.equal<true, true>(true)
})
