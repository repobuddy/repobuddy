import { describe, expect, it } from '@jest/globals'
import { nodejs, tsEsm, watch } from '@repobuddy/jest'
import * as tsEsmPresets from '@repobuddy/jest/presets/ts-esm'
import { filename } from 'dirname-filename-esm'

it(`${filename(import.meta)} executed`, () => { })

describe(`ts-esm preset`, () => {
  it('exports nodejs, tsEsm, and watch config', () => {
    expect(tsEsmPresets.nodejs).toEqual(nodejs)
    expect(tsEsmPresets.watch).toEqual(watch)
    expect(tsEsmPresets.tsEsm).toEqual(tsEsm)
  })
})
