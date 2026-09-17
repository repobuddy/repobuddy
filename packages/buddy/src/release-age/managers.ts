import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

export type PackageManager = 'pnpm' | 'yarn' | 'npm' | 'bun'

type AgeUnit = 'minutes' | 'duration' | 'days' | 'seconds'

export interface ManagerConfig {
	file: string
	ageKey: string
	excludeKey: string
	unit: AgeUnit
	defaultMinutes: number
	defaultNote: string
	versionPin: boolean
	format: 'yaml' | 'ini' | 'toml'
}

export const MANAGERS: Record<PackageManager, ManagerConfig> = {
	pnpm: {
		file: 'pnpm-workspace.yaml',
		ageKey: 'minimumReleaseAge',
		excludeKey: 'minimumReleaseAgeExclude',
		unit: 'minutes',
		defaultMinutes: 1440,
		defaultNote: 'pnpm 11+ defaults to 1440 minutes',
		versionPin: true,
		format: 'yaml',
	},
	yarn: {
		file: '.yarnrc.yml',
		ageKey: 'npmMinimalAgeGate',
		excludeKey: 'npmPreapprovedPackages',
		unit: 'duration',
		defaultMinutes: 1440,
		defaultNote: 'Yarn 4.10+ defaults to 1d',
		versionPin: true,
		format: 'yaml',
	},
	npm: {
		file: '.npmrc',
		ageKey: 'min-release-age',
		excludeKey: 'min-release-age-exclude',
		unit: 'days',
		defaultMinutes: 0,
		defaultNote: 'npm has no default gate',
		versionPin: false,
		format: 'ini',
	},
	bun: {
		file: 'bunfig.toml',
		ageKey: 'minimumReleaseAge',
		excludeKey: 'minimumReleaseAgeExcludes',
		unit: 'seconds',
		defaultMinutes: 0,
		defaultNote: 'bun has no default gate',
		versionPin: false,
		format: 'toml',
	},
}

export function isPackageManager(value: string): value is PackageManager {
	return value in MANAGERS
}

export function detectManager(dir: string): PackageManager | undefined {
	const pkgPath = join(dir, 'package.json')
	if (existsSync(pkgPath)) {
		const field = (JSON.parse(readFileSync(pkgPath, 'utf8')) as { packageManager?: unknown }).packageManager
		const name = typeof field === 'string' ? field.split('@')[0] : undefined
		if (name && isPackageManager(name)) return name
	}
	if (existsSync(join(dir, 'pnpm-lock.yaml')) || existsSync(join(dir, 'pnpm-workspace.yaml'))) return 'pnpm'
	if (existsSync(join(dir, '.yarnrc.yml')) || existsSync(join(dir, 'yarn.lock'))) return 'yarn'
	if (existsSync(join(dir, 'bun.lock')) || existsSync(join(dir, 'bun.lockb')) || existsSync(join(dir, 'bunfig.toml')))
		return 'bun'
	if (existsSync(join(dir, 'package-lock.json')) || existsSync(join(dir, '.npmrc'))) return 'npm'
	return undefined
}
