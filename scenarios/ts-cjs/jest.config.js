const presets = require('@repobuddy/jest/presets/ts-cjs').default

/** @type {import('jest').Config} */
module.exports = {
  ...presets,
  roots: ['<rootDir>/ts']
}
