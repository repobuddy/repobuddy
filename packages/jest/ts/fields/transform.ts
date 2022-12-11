import { Config } from 'jest'
import { NonUndefined } from 'type-plus'
import { optionize } from '../utils/index.js'

export type Transform = NonUndefined<Config['transform']>

export namespace Transform {
  export type TsJestOptions = {
    isolatedModules?: boolean
    useESM?: boolean
    diagnostics?: {
      ignoreCodes?: Array<number | string>
    }
  }
  export type TransformerConfig = string | [string, Record<string, unknown>]
}

export const knownTransforms = {
  tsJestCjs(options: Transform.TsJestOptions = { isolatedModules: true }) {
    return {
      ...this.tsJest(options),
      ...this.esmPackages()
    }
  },
  tsJestEsm(
    options: Transform.TsJestOptions = {
      isolatedModules: true,
      useESM: true,
      diagnostics: {
        // https://github.com/kulshekhar/ts-jest/issues/3820
        ignoreCodes: [151001]
      }
    }
  ) {
    return this.tsJest(options)
  },
  tsJest(options: Transform.TsJestOptions) {
    return {
      '^.+\\.(ts|tsx|cts|mts)$': optionize('ts-jest', options) satisfies Transform.TransformerConfig
    }
  },
  swc(options?: Record<string, unknown>) {
    return {
      '^.+\\.(js|jsx|cjs|mjs|ts|tsx|cts|mts)$': optionize(
        '@swc/jest',
        options
      ) satisfies Transform.TransformerConfig
    }
  },
  esmPackages() {
    return {
      '\\.m?jsx?$': 'jest-esm-transformer-2' satisfies Transform.TransformerConfig
    }
  }
}

export function defineTransform(confg: Transform) {
  return { transform: confg } satisfies Config
}
