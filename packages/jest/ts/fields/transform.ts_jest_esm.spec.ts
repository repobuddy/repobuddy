import { knownTransforms } from './transform.js'

it('provides default transform options for ESM', () => {
  const transform = knownTransforms.tsJestEsm()
  expect(transform).toEqual({
    '^.+\\.(ts|tsx|cts|mts)$': [
      'ts-jest',
      {
        isolatedModules: true,
        useESM: true,
        diagnostics: {
          // https://github.com/kulshekhar/ts-jest/issues/3820
          // this seems to be fixed in 29.0.3
          // but keeping it here until we add the ability to detect jest version.
          ignoreCodes: [151001]
        }
      }
    ]
  })
})

it('retains the ESM config when providing options for other fields', () => {
  const transform = knownTransforms.tsJestEsm({
    astTransformers: {
      before: [
        {
          path: '@formatjs/ts-transformer/ts-jest-integration',
          options: {
            overrideIdFn: '[sha512:contenthash:base64:6]',
            ast: true
          }
        }
      ]
    }
  })

  expect(transform).toEqual({
    '^.+\\.(ts|tsx|cts|mts)$': [
      'ts-jest',
      {
        isolatedModules: true,
        useESM: true,
        diagnostics: {
          // https://github.com/kulshekhar/ts-jest/issues/3820
          // this seems to be fixed in 29.0.3
          // but keeping it here until we add the ability to detect jest version.
          ignoreCodes: [151001]
        },
        astTransformers: {
          before: [
            {
              path: '@formatjs/ts-transformer/ts-jest-integration',
              options: {
                overrideIdFn: '[sha512:contenthash:base64:6]',
                ast: true
              }
            }
          ]
        }
      }
    ]
  })
})
