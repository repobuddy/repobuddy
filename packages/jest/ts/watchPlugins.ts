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

export function defineWatchPlugins(
  config: WatchPlugins = [
    watchPlugins.suspend(),
    watchPlugins.toggleConfig({ setting: 'collectCoverage' }),
    watchPlugins.toggleConfig({ setting: 'verbose' }),
    watchPlugins.typeaheadFilename(),
    watchPlugins.typeaheadTestname()
  ]
) {
  return { watchPlugins: config }
}

export const watchPlugins = {
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

function optionize(name: string, options?: watchPlugins.BaseOptions): ArrayValue<WatchPlugins> {
  return options ? [name, options] : name
}
