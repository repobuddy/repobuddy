import type { Meta, StoryObj } from '@storybook/react'
import { expect } from '@storybook/test'
import { isRunningInTest } from './is-running-in-test.ts'

export default {
	title: 'utils/isRunningInTest',
	parameters: {
		sourceLink: '/is_running_in_test.ts',
	},
	component: () => {
		return (
			<div>
				isRunningInTest: <code data-testid="is-running-in-test-result">{String(isRunningInTest())}</code>
			</div>
		)
	},
} satisfies Meta

export const ResultDependsOnRunner: StoryObj = {
	async play({ canvas }) {
		const result = await canvas.findByTestId('is-running-in-test-result')
		// This is testing itself.
		// But when running storybook not in test, will see the right result
		expect(result.innerHTML).toEqual(isRunningInTest() ? 'true' : 'false')
	},
}
