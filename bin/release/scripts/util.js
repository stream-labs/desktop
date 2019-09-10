// @ts-check

const sh = require('shelljs');
const { executeCmd, error } = require('./prompt');

function getTagCommitId(tag) {
  return executeCmd(`git rev-parse -q --verify "refs/tags/${tag}" || cat /dev/null`, { silent: true }).stdout;
}

function checkEnv(varName) {
  if (!process.env[varName]) {
    error(`Missing environment variable ${varName}`);
    sh.exit(1);
  }
}

module.exports = {
  getTagCommitId,
  checkEnv,
};
