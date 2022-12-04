declare namespace jest {
  interface Matchers<R> {
    toSatisfies(expectation: any): R
    // toSatisfies(expectation: SatisfyExpectation<unknown>): R
  }

  interface Expect {
    toSatisfies(expectation: any): any
    // toSatisfies(expectation: SatisfyExpectation<unknown>): any
  }
}
