import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { CliError, command, z } from 'clibuilder'

export type TestRunner = 'jest' | 'vitest'

/**
 * The scripts this command manages, and the value each runner gets.
 *
 * The union of the values for one script is also the set of values this command
 * recognizes as its own — see `planTestScripts`.
 */
export const managedScripts = {
	test: { jest: 'jest', vitest: 'vitest run' },
	coverage: { jest: 'jest --coverage', vitest: 'vitest run --coverage' },
	'test:watch': { jest: 'jest --watch', vitest: 'vitest' },
} as const

export type ManagedScript = keyof typeof managedScripts

export type ScriptChange = {
	name: ManagedScript
	action: 'add' | 'adjust' | 'skip'
	/** the value the script has now, absent when the script is not there yet */
	from?: string
	/** the value the script would have, same as `from` when the action is `skip` */
	to: string
}

/**
 * The runners a manifest depends on, in the order they are looked for.
 *
 * A project is taken to use a runner when it depends on the runner itself or on
 * the repobuddy preset for it, because a project can use `@repobuddy/vitest` and
 * get `vitest` transitively.
 */
export function detectTestRunners(pkg: Record<string, any>): TestRunner[] {
	const deps = { ...pkg['dependencies'], ...pkg['devDependencies'] }
	const runners: TestRunner[] = []
	if (deps['jest'] || deps['@repobuddy/jest']) runners.push('jest')
	if (deps['vitest'] || deps['@repobuddy/vitest']) runners.push('vitest')
	return runners
}

/**
 * What `test-scripts` would do to a manifest, without touching it.
 *
 * A script that is missing is added. A script whose current value is one this
 * command writes — for either runner — is adjusted to the value for `runner`,
 * which is what makes the command idempotent and what lets a project that moved
 * from jest to vitest pick the new values up. Any other value is a script the
 * project customized deliberately, and is left alone and reported.
 */
export function planTestScripts(pkg: Record<string, any>, runner: TestRunner): ScriptChange[] {
	const scripts: Record<string, string> = pkg['scripts'] ?? {}
	return (Object.keys(managedScripts) as ManagedScript[]).map((name) => {
		const to = managedScripts[name][runner]
		const from = scripts[name]
		if (from === undefined) return { name, action: 'add', to } as const
		const isManaged = Object.values<string>(managedScripts[name]).includes(from)
		if (!isManaged) return { name, action: 'skip', from, to: from } as const
		return from === to ? ({ name, action: 'skip', from, to } as const) : ({ name, action: 'adjust', from, to } as const)
	})
}

/** The indentation the manifest already uses, so rewriting it does not reformat it. */
function detectIndent(source: string) {
	const match = /^[ \t]+(?=")/m.exec(source)
	return match ? match[0] : '\t'
}

export const testScripts = command({
	name: 'test-scripts',
	description: 'Add or adjust the `test`, `coverage`, and `test:watch` scripts for the test runner the project uses.',
	options: {
		cwd: {
			description: 'project directory. Defaults to the current working directory',
			type: z.string().optional(),
		},
		runner: {
			description: 'the test runner to write scripts for. Defaults to the one the project depends on',
			type: z.enum(['jest', 'vitest']).optional(),
		},
	},
	async run({ cwd, runner }) {
		const dir = cwd ?? this.cwd
		const manifestPath = join(dir, 'package.json')
		if (!existsSync(manifestPath)) {
			throw new CliError(`no package.json in ${dir}`, {
				help: 'run this from the project directory, or point at it with --cwd',
			})
		}

		const source = readFileSync(manifestPath, 'utf-8')
		const pkg = JSON.parse(source)

		const resolved = runner ?? resolveRunner(detectTestRunners(pkg))
		const changes = planTestScripts(pkg, resolved)

		const writes = changes.filter((change) => change.action !== 'skip')
		if (writes.length > 0) {
			pkg.scripts = pkg.scripts ?? {}
			for (const change of writes) pkg.scripts[change.name] = change.to
			const indent = detectIndent(source)
			writeFileSync(manifestPath, `${JSON.stringify(pkg, undefined, indent)}${source.endsWith('\n') ? '\n' : ''}`)
		}

		for (const change of changes) {
			if (change.action === 'add') this.ui.info(`added "${change.name}": ${change.to}`)
			else if (change.action === 'adjust') this.ui.info(`adjusted "${change.name}": ${change.from} -> ${change.to}`)
			else this.ui.info(`skipped "${change.name}": ${change.from}`)
		}
		if (writes.length === 0) this.ui.info(`the ${resolved} scripts are already what they should be`)

		return changes
	},
})

function resolveRunner(runners: TestRunner[]): TestRunner {
	if (runners.length === 1) return runners[0]!
	if (runners.length === 0) {
		throw new CliError('cannot tell which test runner this project uses: it depends on neither jest nor vitest', {
			help: ['install jest or vitest first', 'or name the runner with --runner jest|vitest'],
		})
	}
	throw new CliError(`cannot tell which test runner this project uses: it depends on ${runners.join(' and ')}`, {
		help: 'name the one the scripts are for with --runner jest|vitest',
	})
}
