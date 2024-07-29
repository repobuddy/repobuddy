import { v4 } from 'uuid'

it('uuid is a CJS module with browser support', () => {
	expect(v4()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
})
