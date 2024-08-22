export const knownTestEnvironments = {
	electron: '@kayahr/jest-electron-runner/environment',
	jsdom: 'jsdom',
	node: 'node',
}

export const knownTestEnvironmentOptions = {
	electron: {
		options: ['no-sandbox', 'ignore-certificate-errors', 'force-device-scale-factor=1'],
		disableHardwareAcceleration: false,
	},
}
