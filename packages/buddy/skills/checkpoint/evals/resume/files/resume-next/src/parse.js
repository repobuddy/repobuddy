export function parse(input) {
	if (input === '') throw new TypeError('empty input')
	return JSON.parse(input)
}
