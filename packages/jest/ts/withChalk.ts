import type { Config } from 'jest'

export function withChalk<P extends Partial<Config>>(preset: P, mode: 'cjs' | 'esm' = 'esm') {
  if (mode === 'esm') {
    return preset
  }
  return {
    ...preset,
    transformIgnorePatterns: [
      ...preset.transformIgnorePatterns ?? [],
      "/node_modules/(?!chalk)/"
    ]
  }
}
