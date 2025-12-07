import { expect, it } from 'vitest'

it('should get GM timezone', () => {
	const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
	expect(tz).toBe('GMT')
})
