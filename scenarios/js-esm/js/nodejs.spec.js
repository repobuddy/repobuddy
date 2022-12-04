import { describe, expect, it } from '@jest/globals'
import { nodejs, jsEsm, watch } from '@repobuddy/jest'
import * as jsEsmPresets from '@repobuddy/jest/presets/js-esm'
import { filename } from 'dirname-filename-esm'

it(`${filename(import.meta)} executed`, () => { })

describe(`ts-esm preset`, () => {
  it('exports nodejs, tsEsm, and watch config', () => {
    expect(jsEsmPresets.nodejs).toEqual(nodejs)
    expect(jsEsmPresets.watch).toEqual(watch)
    expect(jsEsmPresets.jsEsm).toEqual(jsEsm)
  })
})
