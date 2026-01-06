export function hello(): string {
	// biome-ignore lint/suspicious/noVar: expected error
	var greeting = 'Hello World!'
	return greeting
}
