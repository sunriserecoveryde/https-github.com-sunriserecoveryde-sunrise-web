/** @type {import('jest').Config} */
module.exports = {
  // Plain Node environment – the logic module has no React Native dependencies.
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': [
      'babel-jest',
      {
        // Disable the project-level babel.config.js so the RN worklets plugin
        // (which requires @babel/types from a different version) is never loaded.
        configFile: false,
        babelrc: false,
        presets: [
          ['@babel/preset-env', { targets: { node: 'current' } }],
          ['@babel/preset-typescript', { allExtensions: true }],
        ],
      },
    ],
  },
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
  // Nothing outside the project folder needs to be transformed.
  transformIgnorePatterns: ['/node_modules/'],
};
