const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const { CI } = process.env;

/**
 * exec sync and redirect output to stdio
 */
function exec(cmd) {
  try {
    console.log('RUN', cmd);
    return execSync(cmd, { stdio: [0, 1, 2] });
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

/**
 *  fetching the commit SHA
 */
function getCommitSHA() {
  // the repo is in the detached state for CI
  // we need to take one commit before to take a commit that has been associated to the PR
  console.log('is CI', CI);
  return CI
    ? execSync('git rev-parse HEAD^').toString()
    : execSync('git rev-parse HEAD').toString();
}

/**
 * fetch info about commit using cmd
 */
function getCommitInfo(SHA) {
  const lines = execSync(`git show ${SHA} -s --format="%an|||%ci|||%s"`).toString();
  const [author, dateLine, comment] = lines.split('|||');
  const date = new Date(dateLine).valueOf();
  return {
    SHA,
    author,
    date,
    comment,
  };
}

function checkoutBranch(branchName, config) {
  const branchPath = `${config.dist}/${branchName}`;
  if (!fs.existsSync(branchPath)) fs.mkdirSync(branchPath);
  const checkoutTarget = branchName === 'current' ? getCommitSHA() : branchName;
  fs.removeSync(config.compiledTestsDist);
  exec('git reset --hard');
  exec(`git checkout ${checkoutTarget}`);
  if (branchName !== config.baseBranch) {
    // the base branch may have changes, so merge it
    exec(`git pull origin ${config.baseBranch}`);
  }
  exec('yarn install --frozen-lockfile --check-files');
  exec('yarn compile:ci');

  // save current branch name to the file
  // screenshoter.js will use this value
  fs.writeFileSync(`${config.dist}/current-branch.txt`, branchName);
}

module.exports = {
  exec,
  getCommitSHA,
  getCommitInfo,
  checkoutBranch,
};
