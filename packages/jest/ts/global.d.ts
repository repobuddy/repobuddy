declare namespace jest {
	interface Matchers<R> {
		/**
		 * Check if the value satisfies the expectation.
		 * The expectation can be a value, a regular expression, or a predicate function.
		 *
		 * @see https://github.com/unional/satisfier for more details.
		 */
		toSatisfies(expectation: any): R
	}
}
