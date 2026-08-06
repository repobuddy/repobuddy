export function optionize(name: string, options?: Record<string, unknown>): string | [string, Record<string, unknown>] {
	return options ? [name, options] : name
}
