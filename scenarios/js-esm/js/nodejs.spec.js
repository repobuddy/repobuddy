import { it } from '@jest/globals'
import { filename } from 'dirname-filename-esm'

it(`${filename(import.meta)} executed`, () => { })
