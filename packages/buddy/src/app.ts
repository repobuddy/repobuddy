import { readFileSync } from 'node:fs'
import { cli } from 'clibuilder'

// Both `src/app.ts` and the bundled `esm/bin.js` sit one level below the package root.
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf-8'))

export const app = cli({
	name: 'repobuddy',
	version: pkg.version,
	description: 'Your repo buddy',
	config: true,
})
