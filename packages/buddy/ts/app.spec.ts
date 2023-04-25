import { expect, it } from '@jest/globals'
import { app } from './app.js'

it('version matching package.json', () => {
	expect(app.version).toBe('0.0.0')
})
