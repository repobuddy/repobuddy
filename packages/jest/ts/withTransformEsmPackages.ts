import type { Config } from 'jest'

export function withTransformEsmPackages<P extends Partial<Config>>(preset: P) {
  return {
    ...preset,
    transform: {
      ...preset.transform,
      '\\.m?jsx?$': 'jest-esm-transformer-2'
    },
    transformIgnorePatterns: [
      ...preset.transformIgnorePatterns ?? [],
    ]
  }
}
