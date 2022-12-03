/** @type {import('jest').Config} */
export default {
  runner: '@kayahr/jest-electron-runner/main',
  testEnvironment: 'node',
  testMatch: ['**/?*.(spec|test|integrate|accept|system|unit)(.electron)?.m[jt]sx?$'],
}
