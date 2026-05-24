#!/usr/bin/env node

/**
 * Scaffolds GitHub Actions workflow files based on detected repo state.
 * Reads .github/setup-state.json produced by detect-state.mts.
 * Skips files that already exist.
 * Usage: npx tsx scaffold-workflows.mts --state .github/setup-state.json [--workflows pull-request,release,dependabot-automerge,codeql] [--yes]
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createInterface } from 'node:readline'

// --- Args ---

const args = process.argv.slice(2)
const statePath = args[args.indexOf('--state') + 1] ?? '.github/setup-state.json'
const workflowsArg = args[args.indexOf('--workflows') + 1]
const autoYes = args.includes('--yes') || args.includes('-y')

if (!existsSync(statePath)) {
	console.error(`State file not found: ${statePath}`)
	console.error('Run detect-state.mts first.')
	process.exit(1)
}

interface State {
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

const state = JSON.parse(readFileSync(statePath, 'utf8')) as State
const { detected, defaultBranch } = state

// --- Determine which workflows to offer ---

const allWorkflows = ['pull-request', 'release', 'dependabot-automerge', 'codeql']

let toOffer: string[]
if (workflowsArg) {
	toOffer = workflowsArg.split(',').map((s) => s.trim())
} else {
	// Infer from signals
	const hasWorkflows = detected.existingWorkflows.length > 0
	if (!hasWorkflows) {
		toOffer = [...allWorkflows]
	} else {
		toOffer = []
		if (detected.hasPackageJson) toOffer.push('pull-request', 'release')
		if (detected.hasDependabotConfig) toOffer.push('dependabot-automerge')
		if (detected.language) toOffer.push('codeql')
		toOffer = [...new Set(toOffer)]
	}
}

// --- Filter already-existing ---

const workflowsDir = '.github/workflows'
const toCreate = toOffer.filter((name) => {
	const file = `${name}.yml`
	if (detected.existingWorkflows.includes(file)) {
		console.log(`  [skip] ${file} — already exists`)
		return false
	}
	return true
})

if (toCreate.length === 0) {
	console.log('\nAll requested workflow files already exist. Nothing to create.')
	process.exit(0)
}

console.log('\nWorkflows to create:')
for (const name of toCreate) {
	console.log(`  ${name}.yml`)
}

// --- Confirm ---

async function confirm(): Promise<boolean> {
	if (autoYes) return true
	const rl = createInterface({ input: process.stdin, output: process.stdout })
	return new Promise((resolve) => {
		rl.question('\nCreate these files? [y/N] ', (answer) => {
			rl.close()
			resolve(answer.toLowerCase() === 'y')
		})
	})
}

// --- LTS Node versions ---

const NODE_LTS_VERSIONS = [20, 22, 24]

// --- Install and test commands by package manager ---

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

// --- Workflow templates ---

function pullRequestYml(): string {
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

function releaseYml(): string {
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

function codeqlYml(): string {
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

const templates: Record<string, () => string> = {
	'pull-request': pullRequestYml,
	release: releaseYml,
	'dependabot-automerge': dependabotAutomergeYml,
	codeql: codeqlYml,
}

const ok = await confirm()
if (!ok) {
	console.log('Aborted.')
	process.exit(0)
}

mkdirSync(workflowsDir, { recursive: true })

for (const name of toCreate) {
	const generate = templates[name]
	if (!generate) {
		console.log(`  [skip] ${name} — unknown workflow name`)
		continue
	}
	const filePath = join(workflowsDir, `${name}.yml`)
	writeFileSync(filePath, generate())
	console.log(`  [created] ${filePath}`)
}

console.log('\nDone. Review the generated files before committing — CI steps may need customization.')
