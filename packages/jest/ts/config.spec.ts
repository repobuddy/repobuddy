import { describe, it } from '@jest/globals'
import { a } from 'assertron'
import { every } from 'satisfier'
import { configNode, configSourceDir } from './index.js'

describe(`${configNode.name}()`, () => {
  it('defaults with spec|test|unit|accept|integrate|system identifiers', () => {
    a.satisfies(configNode().testRegex, every(/\(spec|test|unit|accept|integrate|system\)/))
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
