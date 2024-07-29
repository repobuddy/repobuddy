import { expect, it } from '@jest/globals'
import { knownTransforms } from './transform.js'

it('provides default transform options for ESM', () => {
	const transform = knownTransforms.tsJestEsm()
	expect(transform).toEqual({
		'^.+\\.(ts|tsx|cts|mts)$': [
			'ts-jest',
			{
				isolatedModules: true,
				useESM: true,
			},
		],
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
						ast: true,
					},
				},
			],
		},
	})

	expect(transform).toEqual({
		'^.+\\.(ts|tsx|cts|mts)$': [
			'ts-jest',
			{
				isolatedModules: true,
				useESM: true,
				astTransformers: {
					before: [
						{
							path: '@formatjs/ts-transformer/ts-jest-integration',
							options: {
								overrideIdFn: '[sha512:contenthash:base64:6]',
								ast: true,
							},
						},
					],
				},
			},
		],
	})
})
