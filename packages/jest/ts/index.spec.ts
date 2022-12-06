import { jsCjsPreset, jsEsmPreset, tsCjsPreset, tsEsmPreset } from './index.js'

it('exports presets', () => {
  expect(jsCjsPreset).toBeDefined()
  expect(jsEsmPreset).toBeDefined()
  expect(tsCjsPreset).toBeDefined()
  expect(tsEsmPreset).toBeDefined()
})
