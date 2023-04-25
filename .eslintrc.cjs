module.exports = {
  env: {
    node: true,
    es6: true
  },
  extends: [
    'plugin:harmony/latest',
    'plugin:yml/standard'
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  rules: {
    'yml/quotes': ['error', { prefer: 'single' }]
  },
  root: true
}
