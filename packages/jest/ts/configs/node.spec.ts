import { describe, it } from '@jest/globals'
import { a } from 'assertron'
import { every } from 'satisfier'
import { configNode } from './index.js'

describe(`${configNode.name}()`, () => {
  it('defaults with spec|test|unit|accept|integrate|system identifiers', () => {
    a.satisfies(configNode().testRegex, every(/\(spec|test|unit|accept|integrate|system\)/))
  })
})
