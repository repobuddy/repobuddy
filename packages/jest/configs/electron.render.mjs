/** @type {import('jest').Config} */
export default {
  runner: '@kayahr/jest-electron-runner',
  testEnvironment: '@kayahr/jest-electron-runner/environment',
  testMatch: ['**/?*.(spec|test|integrate|accept|system|unit).m[jt]sx?$'],
}
