import { describe, it } from '@jest/globals'
import { a } from 'assertron'
import { every } from 'satisfier'
import { createNodejsConfig } from './index.js'

describe(`${createNodejsConfig.name}()`, () => {
  it('defaults with spec|test|unit|accept|integrate|system identifiers', () => {
    a.satisfies(createNodejsConfig().testRegex, every(/\(spec|test|unit|accept|integrate|system\)/))
  })
})
