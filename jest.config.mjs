
// this does not work because the presets get the root dir as the cwd.
// https://github.com/facebook/jest/issues/9623

/** @type {import('jest').Config} */
const config = {
  projects: [
    "<rootDir>/packages/*",
    "<rootDir>/scenarios/*",
  ]
}

export default config
