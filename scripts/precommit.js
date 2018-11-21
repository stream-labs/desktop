const spawn = require('cross-spawn');
const { isOptedIn, resolveBin } = require('./utils');

const args = process.argv.slice(2);

const config = [];

if (!isOptedIn('pre-commit')) {
  process.exit(0);
}

const lintStagedResult = spawn.sync(resolveBin('lint-staged'), [], {
  env: process.env,
  stdio: 'inherit',
});

if (lintStagedResult.status !== 0) {
  process.exit(lintStagedResult.status);
}
