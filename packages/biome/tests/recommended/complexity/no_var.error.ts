export function hello(): string {
	// biome-ignore lint/style/noVar: fail as expected
	var greeting = 'Hello World!'
	return greeting
}
