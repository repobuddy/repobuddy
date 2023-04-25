import { createSatisfier, formatDiffs, type Expectation } from 'satisfier'

declare module '@jest/expect' {
  interface Matchers<R> {
    /**
     * Check if the value satisfies the expectation.
     * The expectation can be a value, a regular expression, or a predicate function.
     *
     * @see https://github.com/unional/satisfier for more details.
     */
    toSatisfies(expectation: Expectation): R
  }
}

export function toSatisfies(this: any, actual: unknown, expectation: Expectation) {
  const diff = createSatisfier(expectation).exec(actual)
  const pass = !diff
  return {
    pass, message: () => pass
      ? this.utils.matcherHint('.not.toSatisfies', 'received', '') + '\n\n' + `received ${this.utils.printReceived(actual)}`
      : this.utils.matcherHint('.toSatisfies', 'received', '') + '\n\n' + formatDiffs(diff)
  }
}
