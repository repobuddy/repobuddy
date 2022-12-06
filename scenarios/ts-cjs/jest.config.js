const { withChalk, withTransformEsmPackages } = require('@repobuddy/jest')
const preset = require('@repobuddy/jest/presets/ts-cjs').default
const chalkedPreset = withTransformEsmPackages(withChalk(preset, 'cjs'))

// console.log(withChalk)
// console.log(preset)
// console.log(chalked)

/** @type {import('jest').Config} */
module.exports = {
  ...chalkedPreset
}
