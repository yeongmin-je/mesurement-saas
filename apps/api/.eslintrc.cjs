module.exports = {
  root: true,
  extends: ['../../packages/config/eslint-preset.js'],
  parserOptions: { tsconfigRootDir: __dirname, project: './tsconfig.json' },
  ignorePatterns: ['dist', 'node_modules', 'prisma/migrations'],
};
