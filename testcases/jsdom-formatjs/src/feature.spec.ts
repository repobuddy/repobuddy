import { createIntl } from '@formatjs/intl'
import { expect, it } from '@jest/globals'
import { filename } from 'dirname-filename-esm'

it(`hello world`, () => {
	const intl = createIntl({locale: 'en'})
	expect(intl).toBeDefined()
})

it(`${filename(import.meta)} executed`, () => { })
