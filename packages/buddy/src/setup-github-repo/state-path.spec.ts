import { userInfo } from 'node:os'
import { describe, expect, it } from '@jest/globals'
import { stateArtifactPath } from './state-path.js'

describe('stateArtifactPath', () => {
	it('is deterministic per repo and carries the current user', () => {
		const p1 = stateArtifactPath('owner/repo')
		const p2 = stateArtifactPath('owner/repo')
		expect(p1).toBe(p2)
		expect(p1).toContain(userInfo().username.replace(/[^a-zA-Z0-9._-]/g, '-'))
		expect(p1).toContain('owner-repo.json')
	})

	it('slugs unsafe characters out of the repo name', () => {
		const p = stateArtifactPath('ow ner/re:po')
		expect(p).toContain('ow-ner-re-po.json')
	})
})
