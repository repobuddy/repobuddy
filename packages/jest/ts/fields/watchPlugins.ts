import type { Config } from 'jest'
import type { NonUndefined } from 'type-plus'
import { optionize } from '../utils/index.js'

export type WatchPlugins = NonUndefined<Config['watchPlugins']>

export namespace WatchPlugins {
	export type BaseOptions = {
		key?: string
		prompt?: string
	}
	export type SuspendOptions = BaseOptions & {
		'suspend-on-start'?: boolean
	}
	export type ToggleConfig = BaseOptions & {
		setting: string
	}
}

export const knownWatchPlugins = {
	suspend(options?: WatchPlugins.SuspendOptions) {
		return optionize('jest-watch-suspend', options)
	},
	typeaheadFilename(options?: WatchPlugins.BaseOptions) {
		return optionize('jest-watch-typeahead/filename', options)
	},
	typeaheadTestname(options?: WatchPlugins.BaseOptions) {
		return optionize('jest-watch-typeahead/testname', options)
	},
	toggleConfig(options?: WatchPlugins.ToggleConfig) {
		return optionize('jest-watch-toggle-config-2', options)
	}
}

export function defineWatchPlugins(config: WatchPlugins = watchPlugins) {
	return { watchPlugins: config }
}

export const watchPlugins: WatchPlugins = [
	knownWatchPlugins.suspend(),
	knownWatchPlugins.toggleConfig({ setting: 'collectCoverage' }),
	knownWatchPlugins.toggleConfig({ setting: 'verbose' }),
	knownWatchPlugins.typeaheadFilename(),
	knownWatchPlugins.typeaheadTestname()
]
