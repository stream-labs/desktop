const path = require('path');

module.exports = {
  preset: 'ts-jest',
  runner: '@jest-runner/electron',
  modulePaths: [path.resolve(__dirname, 'app')],
  testEnvironment: '@jest-runner/electron/environment',
  testMatch: ['**/app/**/*.test.ts'],
};
