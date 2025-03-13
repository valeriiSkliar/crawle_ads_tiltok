/** @type {import('eslint').Linter.Config} */
export default {
  root: true,
  extends: [
    '@eslint/js',
    'plugin:@typescript-eslint/recommended'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', {
      'vars': 'all',
      'args': 'after-used',
      'ignoreRestSiblings': false,
      'argsIgnorePattern': '^_',
      'varsIgnorePattern': '^_'
    }],
    '@typescript-eslint/consistent-type-imports': ['error', {
      'prefer': 'type-imports'
    }],
    'import/no-unused-modules': ['error', {
      'unusedExports': true
    }]
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json',
    tsconfigRootDir: '.'
  },
  ignorePatterns: ['dist/', 'node_modules/', '*.js', '*.cjs']
};
