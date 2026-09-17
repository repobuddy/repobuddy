import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from '@jest/globals'

const ROOT = join(import.meta.dirname, '..', '..')
const MIN_RELEASE_AGE = join(ROOT, 'skills', 'min-release-age', 'scripts', 'min-release-age.mjs')
const DETECT_ENV = join(ROOT, 'skills', 'init-buddy', 'scripts', 'detect-env.mjs')

describe('built skill bundles', () => {
	it('min-release-age.mjs runs standalone and rejects bad usage with exit 2', () => {
		if (!existsSync(MIN_RELEASE_AGE)) {
			console.warn(`skipping: ${MIN_RELEASE_AGE} does not exist — run \`pnpm build\` first`)
			return
		}
		const r = spawnSync('node', [MIN_RELEASE_AGE, 'not-a-command'], { encoding: 'utf8' })
		expect(r.status).toBe(2)
		expect(r.stderr).toMatch(/usage: min-release-age\.mjs/)
	})

	it('detect-env.mjs runs standalone and prints parseable JSON', () => {
		if (!existsSync(DETECT_ENV)) {
			console.warn(`skipping: ${DETECT_ENV} does not exist — run \`pnpm build\` first`)
			return
		}
		const r = spawnSync('node', [DETECT_ENV, '--json'], { encoding: 'utf8' })
		expect(r.status).toBe(0)
		const parsed = JSON.parse(r.stdout)
		expect(parsed).toHaveProperty('os')
		expect(parsed).toHaveProperty('hosts')
	})
})
