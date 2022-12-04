import { Config } from 'jest'
import { join } from 'node:path'
import uniRequire from 'uni-require'

export function withChalk<P extends Partial<Config>>(preset: P) {
  const chalk = uniRequire.resolve('chalk')
  const chalkRootDir = chalk.slice(0, chalk.lastIndexOf('chalk'))
  return {
    ...preset,
    moduleNameMapper: {
      ...preset.moduleNameMapper,
      chalk,
      '#ansi-styles': join(
        chalkRootDir,
        'chalk/source/vendor/ansi-styles/index.js',
      ),
      '#supports-color': join(
        chalkRootDir,
        'chalk/source/vendor/supports-color/index.js',
      )
    },
    // transform: {
    //   ...preset.transform,
    //   "\\.m?jsx?$": "jest-esm-transformer-2"
    // },
    transformIgnorePatterns: [
      ...preset.transformIgnorePatterns ?? [],
      "/node_modules/(?!chalk)/"
    ]
  }
}
