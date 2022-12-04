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
  overrides: [
    {
      extends: [
        'plugin:harmony/ts-recommended'
      ],
      files: [
        '*.ts',
        '*.tsx'
      ],
      parserOptions: {
        EXPERIMENTAL_useSourceOfProjectReferenceRedirect: true
      },
      rules: {
        '@typescript-eslint/require-await': 'off',
      }
    }
  ],
  root: true
}
