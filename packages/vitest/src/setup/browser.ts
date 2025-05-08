import { afterAll, beforeAll, vi } from 'vitest'

const originalValues = new Intl.DateTimeFormat().resolvedOptions()

beforeAll(() => {
	vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({
		...originalValues,
		timeZone: 'GMT',
	})
})

afterAll(() => {
	vi.restoreAllMocks()
})
