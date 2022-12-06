import { describe, it } from '@jest/globals'
import { a } from 'assertron'
import { every } from 'satisfier'
import { configNodejs, configSourceDir } from './index.js'

describe(`${configNodejs.name}()`, () => {
  it('defaults with spec|test|unit|accept|integrate|system identifiers', () => {
    a.satisfies(configNodejs().testRegex, every(/\(spec|test|unit|accept|integrate|system\)/))
  })
})

describe(`${configSourceDir.name}()`, () => {
  it('can specify different root', () => {
    expect(configSourceDir('ts')).toEqual({
      collectCoverageFrom: [
        '<rootDir>/ts/**/*.{js,jsx,cjs,mjs,ts,tsx,cts,mts}'
      ],
      roots: ['<rootDir>/ts']
    })
  })
})
