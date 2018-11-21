const spawn = require('cross-spawn');
const { isOptedIn, resolveBin } = require('./utils');

if (!isOptedIn('commit-msg')) {
  process.exit(0);
}

const result = spawn.sync(resolveBin('commitlint'), ['-E', 'HUSKY_GIT_PARAMS'], {
  stdio: 'inherit',
});

process.stdout.write('\n');
if (result.status !== 0) {
  process.exit(result.status);
}
