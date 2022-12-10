import type { Config } from 'jest'
import type { ArrayValue, NonUndefined } from 'type-plus'

export type WatchPlugins = NonUndefined<Config['watchPlugins']>

export namespace watchPlugins {
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

export function defineWatchPlugins(config: WatchPlugins = watchPlugins) {
  return { watchPlugins: config }
}

export const knownWatchPlugins = {
  suspend(options?: watchPlugins.SuspendOptions) {
    return optionize('jest-watch-suspend', options)
  },
  typeaheadFilename(options?: watchPlugins.BaseOptions) {
    return optionize('jest-watch-typeahead/filename', options)
  },
  typeaheadTestname(options?: watchPlugins.BaseOptions) {
    return optionize('jest-watch-typeahead/testname', options)
  },
  toggleConfig(options?: watchPlugins.ToggleConfig) {
    return optionize('jest-watch-toggle-config-2', options)
  }
}

export const watchPlugins: WatchPlugins = [
  knownWatchPlugins.suspend(),
  knownWatchPlugins.toggleConfig({ setting: 'collectCoverage' }),
  knownWatchPlugins.toggleConfig({ setting: 'verbose' }),
  knownWatchPlugins.typeaheadFilename(),
  knownWatchPlugins.typeaheadTestname()
]

function optionize(name: string, options?: watchPlugins.BaseOptions): ArrayValue<WatchPlugins> {
  return options ? [name, options] : name
}
