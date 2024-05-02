export function noInnerDeclarations(): string {
	const greeting = 'Hello World!'
	if (greeting) {
		// biome-ignore lint/correctness/noInnerDeclarations: expect to be a warning
		var c = greeting[0]
		return c!
	}
	return greeting
}
