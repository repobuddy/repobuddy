import { describe, it } from '@jest/globals'
import { configSource } from './index.js'

describe(`${configSource.name}()`, () => {
  it('can specify different root', () => {
    expect(configSource('ts')).toEqual({
      collectCoverageFrom: ['<rootDir>/ts/**/*.{js,jsx,cjs,mjs,ts,tsx,cts,mts}'],
      roots: ['<rootDir>/ts']
    })
  })
})
