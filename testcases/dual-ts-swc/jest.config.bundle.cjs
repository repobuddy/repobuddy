const { fields } = require('@repobuddy/jest');

/** @type {import('jest').Config} */
const config = {
  preset: '@repobuddy/jest/presets/jsdom-ts',
  detectOpenHandles: true,
	moduleNameMapper:{
		'^uuid$': require.resolve('uuid')
	}
}

module.exports = config
