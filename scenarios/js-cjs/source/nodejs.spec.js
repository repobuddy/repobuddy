const { nodejs, tsEsm, watch } = require('@repobuddy/jest')
const tsEsmPresets = require('@repobuddy/jest/presets/js-cjs')

it(`${__filename} executed`, () => { })

describe(`js-cjs preset`, () => {
  it('exports nodejs, tsEsm, and watch config', () => {
    expect(tsEsmPresets.nodejs).toEqual(nodejs)
    expect(tsEsmPresets.watch).toEqual(watch)
  })
})
