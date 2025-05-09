import type { Meta, StoryObj } from '@storybook/react'

const meta = {
	title: 'Browser Config/Hello',
	component: () => <div>Hello World</div>,
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
	tags: ['snapshot'],
}
