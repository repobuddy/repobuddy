import { describe, it } from '@jest/globals'
import { ctx } from './configSource.ctx.js'
import { configSource } from './index.js'

describe(`${configSource.name}()`, () => {
  it('can specify different root', () => {
    expect(configSource('source')).toEqual({
      collectCoverageFrom: [
        '<rootDir>/source/**/*.{js,jsx,cjs,mjs,ts,tsx,cts,mts}',
        `!<rootDir>/source/**/*.stories.*`
      ],
      roots: ['<rootDir>/source']
    })
  })

  it('detects source directory', () => {
    expect(configSource()).toEqual({
      collectCoverageFrom: [
        '<rootDir>/ts/**/*.{js,jsx,cjs,mjs,ts,tsx,cts,mts}',
        `!<rootDir>/ts/**/*.stories.*`
      ],
      roots: ['<rootDir>/ts']
    })
  })

  it('defaults to src', () => {
    ctx.existsSync = jest.fn().mockReturnValue(false)
    expect(configSource()).toEqual({
      collectCoverageFrom: [
        '<rootDir>/src/**/*.{js,jsx,cjs,mjs,ts,tsx,cts,mts}',
        `!<rootDir>/src/**/*.stories.*`
      ],
      roots: ['<rootDir>/src']
    })
  })
})
