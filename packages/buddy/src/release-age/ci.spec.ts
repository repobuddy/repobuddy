import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from '@jest/globals'
import { detectCi } from './ci.js'

function ciRepo(files: Record<string, string>): string {
	const dir = mkdtempSync(join(tmpdir(), 'mra-ci-'))
	for (const [f, text] of Object.entries(files)) {
		mkdirSync(join(dir, f, '..'), { recursive: true })
		if (f.endsWith('/')) mkdirSync(join(dir, f), { recursive: true })
		else writeFileSync(join(dir, f), text)
	}
	return dir
}

test('detectCi: hosts from remote URLs', () => {
	const empty = ciRepo({})
	const host = (u: string) => detectCi(empty, u).host
	assert.equal(host('git@github.com:a/b.git'), 'github')
	assert.equal(host('https://gitlab.example.com/a/b.git'), 'gitlab')
	assert.equal(host('ssh://git@gitlab.com:2222/a/b.git'), 'gitlab')
	assert.equal(host('git@bitbucket.org:a/b.git'), 'bitbucket')
	assert.equal(host('https://org@dev.azure.com/org/p/_git/r'), 'azure')
	assert.equal(host('https://codeberg.org/a/b'), 'forgejo')
	assert.equal(host('https://git.example.com/a/b'), 'unknown')
	assert.equal(detectCi(empty, 'git@gitlab.com:a/b.git').provider, 'gitlab')
	assert.equal(detectCi(empty, 'https://git.example.com/a/b').provider, 'other')
	assert.equal(detectCi(empty, '').host, 'unknown')
})

test('detectCi: CI files beat the host; installed job wins', () => {
	const gh = 'git@github.com:a/b.git'
	assert.equal(detectCi(ciRepo({ '.circleci/config.yml': 'x' }), gh).provider, 'circleci')
	assert.equal(detectCi(ciRepo({ '.circleci/config.yml': 'x' }), gh).templated, false)
	assert.equal(detectCi(ciRepo({ '.circleci/config.yml': 'x', '.github/workflows/': '' }), gh).provider, 'github')
	const self = ciRepo({ '.gitlab-ci.yml': 'x' })
	assert.deepEqual(
		[detectCi(self, 'https://git.corp/a/b').provider, detectCi(self, 'https://git.corp/a/b').job],
		['gitlab', '.gitlab/ci/min-release-age.yml'],
	)
	const bb = detectCi(ciRepo({ 'bitbucket-pipelines.yml': 'custom:\n  min-release-age:\n' }), gh)
	assert.deepEqual([bb.provider, bb.installed, bb.job], ['bitbucket', true, 'bitbucket-pipelines.yml'])
})

test('detectCi: reference per provider', () => {
	const r = (files: Record<string, string>, url: string) => detectCi(ciRepo(files), url).reference
	assert.equal(r({}, 'git@github.com:a/b'), 'references/ci/github.md')
	assert.equal(r({ '.gitea/workflows/': '' }, 'https://git.x/a/b'), 'references/ci/forgejo.md')
	assert.equal(r({ Jenkinsfile: 'x' }, 'git@github.com:a/b'), 'references/ci/other.md')
})

test('detectCi: .github/workflows on a Forgejo host targets forgejo', () => {
	const d = detectCi(ciRepo({ '.github/workflows/': '' }), 'https://codeberg.org/a/b')
	assert.deepEqual([d.provider, d.systems, d.reference], ['forgejo', ['forgejo'], 'references/ci/forgejo.md'])
})

test('detectCi: a hostname merely containing "github" now classifies as github (shared host table)', () => {
	const d = detectCi(ciRepo({}), 'https://github.acme.com/a/b')
	assert.equal(d.host, 'github')
})

test('detectCi: GitLab defaults the image and script path until a job is installed', () => {
	const d = detectCi(ciRepo({ '.gitlab-ci.yml': 'x' }), 'git@gitlab.com:a/b.git')
	assert.deepEqual([d.installed, d.image, d.script], [false, 'node:22', 'ci/min-release-age.mjs'])
	assert.equal(detectCi(ciRepo({}), 'git@github.com:a/b.git').image, null)
})

test('detectCi: an installed GitLab job reports the image and script path it actually uses', () => {
	const job = [
		'min-release-age:',
		'  image: registry.corp/mirror/node:22',
		'  script:',
		'    - node .gitlab/ci/min-release-age.mjs restore --json > /tmp/mra.json',
		'',
	].join('\n')
	const d = detectCi(ciRepo({ '.gitlab-ci.yml': 'x', '.gitlab/ci/min-release-age.yml': job }), 'git@gitlab.com:a/b.git')
	assert.deepEqual(
		[d.installed, d.image, d.script],
		[true, 'registry.corp/mirror/node:22', '.gitlab/ci/min-release-age.mjs'],
	)
	const named = job.replace('  image: registry.corp/mirror/node:22', '  image:\n    name: "mirror/node:22"')
	const n = detectCi(ciRepo({ '.gitlab/ci/min-release-age.yml': named }), 'git@gitlab.com:a/b.git')
	assert.equal(n.image, 'mirror/node:22')
})

test('detectCi: the script path comes from any installed job, not the provider default', () => {
	const job = 'jobs:\n  restore:\n    steps:\n      - run: node tools/min-release-age.mjs restore --github-output\n'
	const d = detectCi(ciRepo({ '.github/workflows/min-release-age.yml': job }), 'git@github.com:a/b.git')
	assert.deepEqual([d.script, d.image], ['tools/min-release-age.mjs', null])
})
