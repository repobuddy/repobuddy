import { nodejs, tsCjs, watch } from '@repobuddy/jest'
import * as tsCjsPresets from '@repobuddy/jest/presets/ts-cjs'

it(`${__filename} executed`, () => { })

describe(`ts-cjs preset`, () => {
  it('exports nodejs, tsCjs, and watch config', () => {
    expect(tsCjsPresets.nodejs).toEqual(nodejs)
    expect(tsCjsPresets.watch).toEqual(watch)
    expect(tsCjsPresets.tsCjs).toEqual(tsCjs)
  })
})
