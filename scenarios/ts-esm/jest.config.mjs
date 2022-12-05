import { withChalk } from '@repobuddy/jest'
import preset from '@repobuddy/jest/presets/ts-esm'

/** @type {import('jest').Config} */
export default {
  ...withChalk(preset),
  roots: ['<rootDir>/ts']
}
