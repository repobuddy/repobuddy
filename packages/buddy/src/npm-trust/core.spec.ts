import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from '@jest/globals'
import {
	apply,
	derivePackages,
	detectCallerWorkflow,
	isPublished,
	type NpmTrustDeps,
	plan,
	resolveRepos,
} from './core.js'
import type { Sh } from './exec.js'

let dir: string

beforeEach(() => {
	dir = mkdtempSync(join(tmpdir(), 'npm-trust-'))
})

afterEach(() => {
	rmSync(dir, { recursive: true, force: true })
})

const RELEASE_WORKFLOW = `
on:
  push:
    branches: [main]
jobs:
  release:
    steps:
      - run: npx changeset publish
`

function fakeSh(handlers: Record<string, (cmd: string) => string>): Sh {
	return (cmd: string) => {
		for (const [key, handler] of Object.entries(handlers)) {
			if (cmd.includes(key)) return handler(cmd)
		}
		throw new Error(`unexpected command: ${cmd}`)
	}
}

function ghFileResponse(content: string): string {
	return Buffer.from(content).toString('base64')
}

describe('resolveRepos', () => {
	it('returns the single --repo when given', () => {
		expect(resolveRepos(fakeSh({}), { repo: 'octo/one' }, () => {})).toEqual(['octo/one'])
	})

	it('lists an org’s source repos', () => {
		const sh = fakeSh({
			'gh repo list acme': () => 'acme/a\nacme/b\n',
		})
		expect(resolveRepos(sh, { org: 'acme' }, () => {})).toEqual(['acme/a', 'acme/b'])
	})

	it('lists the caller plus every org for --all-orgs', () => {
		const sh = fakeSh({
			'gh api user --jq .login': () => 'me',
			'gh api user/orgs': () => 'acme\n',
			'gh repo list me': () => 'me/a\n',
			'gh repo list acme': () => 'acme/b\n',
		})
		const logs: string[] = []
		expect(resolveRepos(sh, { allOrgs: true }, (m) => logs.push(m))).toEqual(['me/a', 'acme/b'])
		expect(logs[0]).toContain('owner: me')
	})

	it('throws when no scope is given', () => {
		expect(() => resolveRepos(fakeSh({}), {}, () => {})).toThrow(/scope required/)
	})
})

describe('derivePackages', () => {
	function exact(handlers: Record<string, string>): Sh {
		return (cmd) => {
			if (cmd in handlers) return handlers[cmd] as string
			throw new Error(`unexpected command: ${cmd}`)
		}
	}

	it('returns the single package for a non-private root', () => {
		const sh = exact({
			'gh api repos/octo/repo/contents/package.json --jq .content': ghFileResponse(
				JSON.stringify({ name: 'foo', private: false }),
			),
		})
		expect(derivePackages(sh, 'octo/repo')).toEqual([{ name: 'foo' }])
	})

	it('returns nothing when the root package.json cannot be fetched', () => {
		const sh: Sh = () => {
			throw new Error('not found')
		}
		expect(derivePackages(sh, 'octo/repo')).toEqual([])
	})

	it('returns nothing when the root package.json is not valid JSON', () => {
		const sh = exact({
			'gh api repos/octo/repo/contents/package.json --jq .content': ghFileResponse('not json'),
		})
		expect(derivePackages(sh, 'octo/repo')).toEqual([])
	})

	it('resolves a pnpm-workspace.yaml monorepo', () => {
		const sh = exact({
			'gh api repos/octo/mono/contents/package.json --jq .content': ghFileResponse(
				JSON.stringify({ name: 'root', private: true }),
			),
			'gh api repos/octo/mono/contents/pnpm-workspace.yaml --jq .content':
				ghFileResponse('packages:\n  - packages/*\n'),
			'gh api repos/octo/mono/contents/packages': JSON.stringify([{ name: 'a', type: 'dir' }]),
			'gh api repos/octo/mono/contents/packages/a/package.json --jq .content': ghFileResponse(
				JSON.stringify({ name: '@x/a' }),
			),
		})
		expect(derivePackages(sh, 'octo/mono')).toEqual([{ name: '@x/a' }])
	})

	it('resolves array-form workspaces without globs', () => {
		const sh = exact({
			'gh api repos/octo/mono/contents/package.json --jq .content': ghFileResponse(
				JSON.stringify({ name: 'root', private: true, workspaces: ['lib'] }),
			),
			'gh api repos/octo/mono/contents/lib/package.json --jq .content': ghFileResponse(
				JSON.stringify({ name: '@x/lib' }),
			),
		})
		expect(derivePackages(sh, 'octo/mono')).toEqual([{ name: '@x/lib' }])
	})

	it('resolves workspaces.packages object form', () => {
		const sh = exact({
			'gh api repos/octo/mono/contents/package.json --jq .content': ghFileResponse(
				JSON.stringify({ name: 'root', private: true, workspaces: { packages: ['pkgs/*'] } }),
			),
			'gh api repos/octo/mono/contents/pkgs': JSON.stringify([{ name: 'p1', type: 'dir' }]),
			'gh api repos/octo/mono/contents/pkgs/p1/package.json --jq .content': ghFileResponse(
				JSON.stringify({ name: '@x/p1' }),
			),
		})
		expect(derivePackages(sh, 'octo/mono')).toEqual([{ name: '@x/p1' }])
	})

	it('falls back to a top-level directory scan when no workspace globs resolve', () => {
		const sh: Sh = (cmd) => {
			if (cmd === 'gh api repos/octo/mono/contents/package.json --jq .content')
				return ghFileResponse(JSON.stringify({ name: 'root', private: true }))
			if (cmd === 'gh api repos/octo/mono/contents/pnpm-workspace.yaml --jq .content') throw new Error('missing')
			if (cmd === 'gh api repos/octo/mono/contents/') return JSON.stringify([{ name: 'pkg-a', type: 'dir' }])
			if (cmd === 'gh api repos/octo/mono/contents/pkg-a/package.json --jq .content')
				return ghFileResponse(JSON.stringify({ name: 'pkg-a' }))
			throw new Error(`unexpected: ${cmd}`)
		}
		expect(derivePackages(sh, 'octo/mono')).toEqual([{ name: 'pkg-a' }])
	})

	it('skips dot-directories and unparseable/private nested package.json files', () => {
		const sh: Sh = (cmd) => {
			if (cmd === 'gh api repos/octo/mono/contents/package.json --jq .content')
				return ghFileResponse(JSON.stringify({ name: 'root', private: true, workspaces: ['a', 'b', '.hidden'] }))
			if (cmd === 'gh api repos/octo/mono/contents/a/package.json --jq .content') return ghFileResponse('not json')
			if (cmd === 'gh api repos/octo/mono/contents/b/package.json --jq .content')
				return ghFileResponse(JSON.stringify({ name: 'b', private: true }))
			throw new Error(`unexpected: ${cmd}`)
		}
		expect(derivePackages(sh, 'octo/mono')).toEqual([])
	})
})

describe('detectCallerWorkflow', () => {
	it('scores and prefers a workflow literally named release.yml over a publish-named one', () => {
		const sh: Sh = (cmd) => {
			if (cmd.includes('contents/.github/workflows') && !cmd.includes('.yml'))
				return JSON.stringify([{ name: 'release.yml' }, { name: 'publish.yml' }, { name: 'other.yml' }])
			if (cmd.includes('workflows/release.yml')) return ghFileResponse(RELEASE_WORKFLOW)
			if (cmd.includes('workflows/publish.yml')) return ghFileResponse(RELEASE_WORKFLOW)
			if (cmd.includes('workflows/other.yml')) return ghFileResponse(RELEASE_WORKFLOW)
			throw new Error(`unexpected: ${cmd}`)
		}
		const result = detectCallerWorkflow(sh, 'octo/repo')
		expect(result).toEqual({ workflow: 'release.yml', confident: true })
	})

	it('skips a workflow that triggers on push to main but never publishes', () => {
		const sh: Sh = (cmd) => {
			if (cmd.includes('contents/.github/workflows') && !cmd.includes('.yml'))
				return JSON.stringify([{ name: 'ci.yml' }])
			if (cmd.includes('workflows/ci.yml'))
				return ghFileResponse('on:\n  push:\n    branches: [main]\njobs:\n  test:\n    steps:\n      - run: npm test\n')
			throw new Error(`unexpected: ${cmd}`)
		}
		expect(detectCallerWorkflow(sh, 'octo/repo')).toEqual({ workflow: 'ci.yml', confident: false })
	})

	it('falls back to release.yml, unconfident, when nothing matches', () => {
		const sh: Sh = (cmd) => {
			if (cmd.includes('contents/.github/workflows') && !cmd.includes('.yml'))
				return JSON.stringify([{ name: 'ci.yml' }])
			if (cmd.includes('workflows/ci.yml')) return ghFileResponse('on: push\n')
			throw new Error(`unexpected: ${cmd}`)
		}
		expect(detectCallerWorkflow(sh, 'octo/repo')).toEqual({ workflow: 'ci.yml', confident: false })
	})

	it('falls back to the first yml file when nothing matches and none is named release.yml', () => {
		const sh: Sh = () => JSON.stringify([{ name: 'ci.yml' }, { name: 'deploy.yml' }])
		// contents listing succeeds, but every workflow body fetch fails -> ghFile returns null -> no match
		const sh2: Sh = (cmd) => {
			if (cmd.includes('contents/.github/workflows') && !cmd.includes('.yml')) return sh(cmd)
			throw new Error('missing body')
		}
		expect(detectCallerWorkflow(sh2, 'octo/repo')).toEqual({ workflow: 'ci.yml', confident: false })
	})

	it('returns release.yml with no names when the workflows directory has none', () => {
		const sh: Sh = () => {
			throw new Error('missing')
		}
		expect(detectCallerWorkflow(sh, 'octo/repo')).toEqual({ workflow: 'release.yml', confident: false })
	})
})

describe('isPublished', () => {
	it('is true when npm view succeeds and false when it throws', () => {
		expect(isPublished(() => '1.0.0', 'foo')).toBe(true)
		expect(
			isPublished(() => {
				throw new Error('E404')
			}, 'foo'),
		).toBe(false)
	})
})

describe('plan', () => {
	it('plans a single package against an explicit repo and workflow file', () => {
		const sh: Sh = (cmd) => {
			if (cmd.includes('npm view')) return '1.0.0'
			throw new Error(`unexpected: ${cmd}`)
		}
		const result = plan({ package: 'foo', repo: 'octo/repo', file: 'release.yml', dir }, { sh })
		expect(result.rows).toEqual([{ package: 'foo', repo: 'octo/repo', workflow: 'release.yml', action: 'configure' }])
		expect(existsSync(join(dir, '.github', 'npm-trust-plan.json'))).toBe(true)
	})

	it('requires --repo alongside --package', () => {
		expect(() => plan({ package: 'foo', dir }, {})).toThrow(/--package requires --repo/)
	})

	it('reports not-published for a package npm has never seen', () => {
		const sh: Sh = (cmd) => {
			if (cmd.includes('npm view')) throw new Error('E404')
			throw new Error(`unexpected: ${cmd}`)
		}
		const result = plan({ package: 'foo', repo: 'octo/repo', file: 'release.yml', dir }, { sh })
		expect(result.rows[0]?.action).toBe('not-published')
	})

	it('reports a private repo with nothing published, across a resolved scope', () => {
		const sh: Sh = (cmd) => {
			if (cmd.includes('gh repo list')) return 'octo/repo\n'
			if (cmd.includes('package.json')) throw new Error('missing')
			throw new Error(`unexpected: ${cmd}`)
		}
		const logs: string[] = []
		const result = plan({ org: 'octo', dir }, { sh, log: (m) => logs.push(m) })
		expect(result.rows).toEqual([
			{ package: '-', repo: 'octo/repo', workflow: '-', action: 'private', note: 'nothing published' },
		])
		expect(logs.some((l) => l.includes('scanning'))).toBe(true)
	})

	it('plans every package in a monorepo across a resolved scope, tagging low-confidence workflow guesses', () => {
		const sh: Sh = (cmd) => {
			if (cmd.includes('gh repo list')) return 'octo/mono\n'
			if (cmd.includes('contents/package.json'))
				return ghFileResponse(JSON.stringify({ name: 'root', private: true, workspaces: ['pkg'] }))
			if (cmd.includes('pkg/package.json')) return ghFileResponse(JSON.stringify({ name: '@x/pkg' }))
			if (cmd.includes('contents/.github/workflows') && !cmd.includes('.yml'))
				return JSON.stringify([{ name: 'ci.yml' }])
			if (cmd.includes('workflows/ci.yml')) return ghFileResponse('on: push\n')
			if (cmd.includes('npm view')) return '1.0.0'
			throw new Error(`unexpected: ${cmd}`)
		}
		const result = plan({ org: 'octo', dir }, { sh })
		expect(result.rows).toEqual([
			{
				package: '@x/pkg',
				repo: 'octo/mono',
				workflow: 'ci.yml',
				action: 'configure',
				note: 'workflow guessed - confirm before applying',
			},
		])
	})
})

describe('apply', () => {
	function writePlan(rows: unknown[]) {
		mkdirSync(join(dir, '.github'), { recursive: true })
		writeFileSync(join(dir, '.github', 'npm-trust-plan.json'), JSON.stringify({ rows }))
	}

	it('throws when there is no plan', () => {
		expect(() => apply({ otp: '123456', dir }, {})).toThrow(/no plan at/)
	})

	it('throws when no otp is given', () => {
		writePlan([])
		expect(() => apply({ dir }, {})).toThrow(/--otp=<code> required/)
	})

	it('configures every row with action=configure and skips the rest', () => {
		writePlan([
			{ package: 'a', repo: 'octo/repo', workflow: 'release.yml', action: 'configure' },
			{ package: 'b', repo: 'octo/repo', workflow: 'release.yml', action: 'not-published' },
		])
		const calls: string[][] = []
		const deps: NpmTrustDeps = {
			npmTrustGithub: (args) => {
				calls.push(args)
			},
			wait: () => {},
		}
		const result = apply({ otp: '123456', dir }, deps)
		expect(result).toEqual({ ok: true, configured: 1, alreadyConfigured: 0, failed: 0 })
		expect(calls).toEqual([
			['trust', 'github', 'a', '--file', 'release.yml', '--repo', 'octo/repo', '--allow-publish', '-y', '--otp=123456'],
		])
	})

	it('counts an E409 as already-configured, not failed', () => {
		writePlan([{ package: 'a', repo: 'octo/repo', workflow: 'release.yml', action: 'configure' }])
		const deps: NpmTrustDeps = {
			npmTrustGithub: () => {
				throw new Error('npm error code E409\n409 Conflict')
			},
			wait: () => {},
		}
		const result = apply({ otp: '123456', dir }, deps)
		expect(result).toEqual({ ok: true, configured: 0, alreadyConfigured: 1, failed: 0 })
	})

	it('stops immediately on an auth failure and reports the row it stopped on', () => {
		writePlan([
			{ package: 'a', repo: 'octo/repo', workflow: 'release.yml', action: 'configure' },
			{ package: 'b', repo: 'octo/repo', workflow: 'release.yml', action: 'configure' },
		])
		const calls: string[] = []
		const deps: NpmTrustDeps = {
			npmTrustGithub: (args) => {
				calls.push(args[2] as string)
				throw new Error('npm error E401 Unauthorized')
			},
			wait: () => {},
		}
		const result = apply({ otp: '123456', dir }, deps)
		expect(result).toEqual({ ok: false, configured: 0, failed: 1, stoppedOn: 'a', reason: 'auth' })
		expect(calls).toEqual(['a'])
	})

	it('keeps going and counts non-auth failures, logging the npm error line', () => {
		writePlan([{ package: 'a', repo: 'octo/repo', workflow: 'release.yml', action: 'configure' }])
		const logs: string[] = []
		const deps: NpmTrustDeps = {
			npmTrustGithub: () => {
				throw new Error('some setup line\nnpm error code E500\nmore output')
			},
			wait: () => {},
			log: (m) => logs.push(m),
		}
		const result = apply({ otp: '123456', dir }, deps)
		expect(result).toEqual({ ok: false, configured: 0, alreadyConfigured: 0, failed: 1 })
		expect(logs.some((l) => l.includes('npm error code E500'))).toBe(true)
	})
})
