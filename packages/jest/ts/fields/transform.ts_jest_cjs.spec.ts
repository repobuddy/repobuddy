import { expect, it } from '@jest/globals'
import { knownTransforms } from './transform.js'

it('provides default transform options for CJS', () => {
  const transform = knownTransforms.tsJestCjs()
  expect(transform).toEqual({
    '^.+\\.(ts|tsx|cts|mts)$': [
      'ts-jest',
      {
        isolatedModules: true
      }
    ],
    '\\.m?jsx?$': 'jest-esm-transformer-2'
  })
})

it('retains the CJS config when providing options for other fields', () => {
  const transform = knownTransforms.tsJestCjs({
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
    ],
    '\\.m?jsx?$': 'jest-esm-transformer-2'
  })
})
