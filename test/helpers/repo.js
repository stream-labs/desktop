const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const { CI } = process.env;

const CONFIG = {
  dist: 'test-dist',
  compiledTestsDist: path.resolve('test-dist', 'test'),
};

/**
 * exec sync or die
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

function getCommitSHA() {
  // fetching the commit SHA
  const lastCommits = execSync('git log -n 2 --pretty=oneline')
    .toString()
    .split('\n')
    .map(log => log.split(' ')[0]);

  // the repo is in the detached state for CI
  // we need to take a one commit before to take a commit that has been associated to the PR
  return CI ? lastCommits[1] : lastCommits[0];
}

function checkoutBranch(branchName) {
  const branchPath = `${CONFIG.dist}/${branchName}`;
  if (!fs.existsSync(branchPath)) fs.mkdirSync(branchPath);
  const checkoutTarget = branchName === 'current' ? getCommitSHA() : branchName;
  fs.removeSync(CONFIG.compiledTestsDist);
  exec('git reset --hard');
  exec(`git checkout ${checkoutTarget}`);
  if (branchName !== CONFIG.baseBranch) {
    // the base branch may have changes, so merge it
    exec(`git pull origin ${CONFIG.baseBranch}`);
  }
  exec('yarn install --frozen-lockfile --check-files');
  exec('yarn compile:ci');
  // save current branch name to the file
  // screenshoter.js will use this value
  fs.writeFileSync(`${CONFIG.dist}/current-branch.txt`, branchName);
}

module.exports = {
  exec,
  getCommitSHA,
  checkoutBranch,
};
