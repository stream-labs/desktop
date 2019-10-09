const { exec } = require('child_process');
const { version } = require('../package.json');
const { getVersionContext } = require('./release/scripts/patchNote');

const { channel } = getVersionContext(`v${version}`);

const childProcess = exec(`yarn start:${channel}`);

process.stdin.pipe(childProcess.stdin);
childProcess.stdout.pipe(process.stdout);
childProcess.stderr.pipe(process.stderr);

childProcess.on('close', code => {
  process.exitCode = code;
  process.stdin.unref();
});
