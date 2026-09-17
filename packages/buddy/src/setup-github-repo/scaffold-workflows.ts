/**
 * Scaffolds GitHub Actions workflow files based on detected repo state (written by `detect-state.ts`).
 * Skips files that already exist.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { createInterface } from 'node:readline'
import { type Exec, realExec } from './exec.js'
import { stateArtifactPath } from './state-path.js'

export interface ScaffoldState {
	repo: string
	defaultBranch: string
	detected: {
		language: string | null
		codeqlLanguage: string | null
		packageManager: string | null
		hasPackageJson: boolean
		hasDependabotConfig: boolean
		existingWorkflows: string[]
	}
}

export const ALL_WORKFLOWS = ['pull-request', 'release', 'dependabot-automerge', 'codeql']

const NODE_LTS_VERSIONS = [20, 22, 24]

function installCmd(pm: string | null): string {
	switch (pm) {
		case 'pnpm':
			return 'pnpm install --frozen-lockfile'
		case 'bun':
			return 'bun install --frozen-lockfile'
		case 'yarn':
			return 'yarn install --frozen-lockfile'
		default:
			return 'npm ci'
	}
}

function testCmd(pm: string | null): string {
	switch (pm) {
		case 'pnpm':
			return 'pnpm test'
		case 'bun':
			return 'bun test'
		case 'yarn':
			return 'yarn test'
		default:
			return 'npm test'
	}
}

function setupNodeAction(pm: string | null): string {
	const cacheMap: Record<string, string> = { pnpm: 'pnpm', bun: 'bun', yarn: 'yarn', npm: 'npm' }
	const cache = cacheMap[pm ?? 'npm'] ?? 'npm'
	const extra = pm === 'pnpm' ? '\n      - uses: pnpm/action-setup@v4' : ''
	return `${extra}
      - uses: actions/setup-node@v4
        with:
          node-version: \${{ matrix.node-version }}
          cache: '${cache}'`
}

function pullRequestYml(detected: ScaffoldState['detected']): string {
	const pm = detected.packageManager
	const isNode = detected.hasPackageJson || pm !== null
	const matrix = isNode
		? `    strategy:
      fail-fast: false
      matrix:
        node-version: ${JSON.stringify(NODE_LTS_VERSIONS)}\n`
		: ''
	const nodeSetup = isNode ? setupNodeAction(pm) : ''
	const install = isNode ? `\n      - run: ${installCmd(pm)}` : ''
	const test = isNode
		? `\n      - run: ${testCmd(pm)}
        # TODO: add lint, type-check, and other CI commands here`
		: `\n      - run: echo "TODO: add your CI commands here"  # TODO: replace with actual commands`

	return `name: pull-request
on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  ci:
    runs-on: ubuntu-latest
${matrix}    steps:
      - uses: actions/checkout@v4${nodeSetup}${install}${test}

  all-checks:
    needs: [ci]
    runs-on: ubuntu-latest
    if: always()
    steps:
      - name: All checks passed
        run: |
          if [[ "\${{ contains(needs.*.result, 'failure') || contains(needs.*.result, 'cancelled') }}" == "true" ]]; then
            exit 1
          fi
`
}

function releaseYml(detected: ScaffoldState['detected'], defaultBranch: string): string {
	const pm = detected.packageManager
	const isNode = detected.hasPackageJson || pm !== null
	const matrix = isNode
		? `    strategy:
      fail-fast: false
      matrix:
        node-version: ${JSON.stringify(NODE_LTS_VERSIONS)}\n`
		: ''
	const nodeSetup = isNode ? setupNodeAction(pm) : ''
	const install = isNode ? `\n      - run: ${installCmd(pm)}` : ''
	const test = isNode
		? `\n      - run: ${testCmd(pm)}`
		: `\n      - run: echo "TODO: add your CI commands here"  # TODO: replace`

	return `name: release
on:
  push:
    branches: [${defaultBranch}]

jobs:
  ci:
    runs-on: ubuntu-latest
${matrix}    steps:
      - uses: actions/checkout@v4${nodeSetup}${install}${test}

  release:
    needs: [ci]
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0${
						isNode
							? '\n' +
								'      ' +
								setupNodeAction(pm)
									.trim()
									.split('\n')
									.map((l) => '      ' + l.trimStart())
									.join('\n')
							: ''
					}${isNode ? '\n      - run: ' + installCmd(pm) : ''}
      # TODO: add your release steps here (e.g. npx changeset publish, cargo publish, goreleaser)
`
}

function dependabotAutomergeYml(): string {
	return `name: dependabot-automerge
on: pull_request

permissions:
  contents: write
  pull-requests: write

jobs:
  dependabot:
    runs-on: ubuntu-latest
    if: github.actor == 'dependabot[bot]'
    steps:
      - name: Fetch Dependabot metadata
        id: metadata
        uses: dependabot/fetch-metadata@v2

      - name: Auto-merge patch and minor updates
        if: |
          steps.metadata.outputs.update-type == 'version-update:semver-patch' ||
          steps.metadata.outputs.update-type == 'version-update:semver-minor'
        run: gh pr merge --auto --squash "$PR_URL"
        env:
          PR_URL: \${{ github.event.pull_request.html_url }}
          GH_TOKEN: \${{ secrets.GITHUB_TOKEN }}
`
}

function codeqlYml(detected: ScaffoldState['detected'], defaultBranch: string): string {
	const lang = detected.codeqlLanguage ?? 'javascript'
	return `name: CodeQL
on:
  push:
    branches: [${defaultBranch}]
  pull_request:
    branches: [${defaultBranch}]
  schedule:
    - cron: '30 5 * * 1'

jobs:
  analyze:
    name: Analyze
    runs-on: ubuntu-latest
    permissions:
      actions: read
      contents: read
      security-events: write

    strategy:
      fail-fast: false
      matrix:
        language: ['${lang}']
        # Supported: javascript, python, go, java, csharp, cpp, ruby, swift

    steps:
      - uses: actions/checkout@v4
      - uses: github/codeql-action/init@v3
        with:
          languages: \${{ matrix.language }}
      - uses: github/codeql-action/autobuild@v3
      - uses: github/codeql-action/analyze@v3
`
}

export interface ScaffoldWorkflowsOptions {
	statePath?: string
	workflows?: string
	yes?: boolean
	/** Repo working directory the `.github/workflows` folder is created under. Defaults to cwd. */
	dir?: string
	exec?: Exec
	/** Asked when `yes` is not set. Defaults to an interactive stdin/stderr prompt. */
	confirm?: () => Promise<boolean>
	log?: (message: string) => void
}

export interface ScaffoldWorkflowsResult {
	ok: boolean
	created: string[]
	skipped: Array<{ name: string; reason: string }>
	reason?: string
}

/* istanbul ignore next -- real interactive stdin prompt; every caller is exercised in tests through an injected `confirm` instead */
function defaultConfirm(): Promise<boolean> {
	const rl = createInterface({ input: process.stdin, output: process.stderr })
	return new Promise((resolvePromise) => {
		rl.question('\nCreate these files? [y/N] ', (answer) => {
			rl.close()
			resolvePromise(answer.toLowerCase() === 'y')
		})
	})
}

export async function scaffoldWorkflows(options: ScaffoldWorkflowsOptions = {}): Promise<ScaffoldWorkflowsResult> {
	const exec = options.exec ?? realExec
	const dir = resolve(options.dir ?? process.cwd())
	const log = options.log ?? (() => {})

	const statePath =
		options.statePath ?? stateArtifactPath(exec.run('gh repo view --json nameWithOwner --jq .nameWithOwner'))

	if (!existsSync(statePath)) {
		throw new Error(`State file not found: ${statePath}\nRun detect-state first.`)
	}

	const state = JSON.parse(readFileSync(statePath, 'utf8')) as ScaffoldState
	const { detected, defaultBranch } = state

	let toOffer: string[]
	if (options.workflows) {
		toOffer = options.workflows.split(',').map((s) => s.trim())
	} else {
		const hasWorkflows = detected.existingWorkflows.length > 0
		if (!hasWorkflows) {
			toOffer = [...ALL_WORKFLOWS]
		} else {
			toOffer = []
			if (detected.hasPackageJson) toOffer.push('pull-request', 'release')
			if (detected.hasDependabotConfig) toOffer.push('dependabot-automerge')
			if (detected.language) toOffer.push('codeql')
			toOffer = [...new Set(toOffer)]
		}
	}

	const workflowsDir = join(dir, '.github', 'workflows')
	const skipped: Array<{ name: string; reason: string }> = []

	const toCreate = toOffer.filter((name) => {
		const file = `${name}.yml`
		if (detected.existingWorkflows.includes(file)) {
			skipped.push({ name: file, reason: 'already exists' })
			log(`  [skip] ${file} — already exists`)
			return false
		}
		return true
	})

	if (toCreate.length === 0) {
		return { ok: true, created: [], skipped }
	}

	log('\nWorkflows to create:')
	for (const name of toCreate) log(`  ${name}.yml`)

	const confirm = options.yes ? () => Promise.resolve(true) : (options.confirm ?? defaultConfirm)
	const ok = await confirm()
	if (!ok) {
		return { ok: false, reason: 'aborted', created: [], skipped }
	}

	mkdirSync(workflowsDir, { recursive: true })

	const templates: Record<string, () => string> = {
		'pull-request': () => pullRequestYml(detected),
		release: () => releaseYml(detected, defaultBranch),
		'dependabot-automerge': dependabotAutomergeYml,
		codeql: () => codeqlYml(detected, defaultBranch),
	}

	const created: string[] = []
	for (const name of toCreate) {
		const generate = templates[name]
		if (!generate) {
			skipped.push({ name: `${name}.yml`, reason: 'unknown workflow name' })
			log(`  [skip] ${name} — unknown workflow name`)
			continue
		}
		// Reported relative to `dir` (as the original script, run from the repo root, always did),
		// even though the file is written under the absolute `workflowsDir` computed above.
		const relativePath = join('.github', 'workflows', `${name}.yml`)
		writeFileSync(join(workflowsDir, `${name}.yml`), generate())
		created.push(relativePath)
		log(`  [created] ${relativePath}`)
	}

	log('\nDone. Review the generated files before committing — CI steps may need customization.')

	return { ok: true, created, skipped }
}
