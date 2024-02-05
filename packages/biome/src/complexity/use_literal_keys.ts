const x: { a: string } & {
	[key: string]: string
} = { a: 'a' }

console.info(x['y'])
