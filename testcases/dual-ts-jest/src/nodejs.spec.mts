import { filename } from 'dirname-filename-esm'
import { testType } from 'type-plus'

it(`${filename(import.meta)} executed`, () => {})

it('pure ESM', () => {
	testType.equal<true, true>(true)
})
