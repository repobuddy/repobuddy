import { Config } from 'jest'
import { AnyRecord, NonUndefined } from 'type-plus'
import { optionize } from '../utils/index.js'

export type Transform = NonUndefined<Config['transform']>

export namespace Transform {
  export type TsJestOptions = {
    compiler?: string
    tsconfig?: string
    isolatedModules?: boolean
    astTransformers?: AnyRecord
    diagnostics?:
      | boolean
      | {
          ignoreCodes?: Array<number | string>
        }
    babelConfig?: boolean | string | AnyRecord
    stringifyContentPathRegex?: string | RegExp
    useESM?: boolean
  }
  export type TransformerConfig = string | [string, Record<string, unknown>]
}

export const knownTransforms = {
  /**
   * Using `ts-jest` transform with CJS default options.
   *
   * By default it will enable `isolatedModules`,
   * and transforms ESM dependencies to CJS.
   */
  tsJestCjs(options?: Transform.TsJestOptions) {
    return {
      ...this.tsJest({
        isolatedModules: true,
        ...options
      }),
      ...this.esmPackages()
    }
  },
  /**
   * Using `ts-jest` transform with ESM default options.
   *
   * By default it will enable `isolatedModules`.
   */
  tsJestEsm(options?: Transform.TsJestOptions) {
    return this.tsJest({
      isolatedModules: true,
      useESM: true,
      diagnostics: {
        // https://github.com/kulshekhar/ts-jest/issues/3820
        ignoreCodes: [151001]
      },
      ...options
    })
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

export function defineTransform(transform: Transform) {
  return { transform } satisfies Config
}
