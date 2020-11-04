const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const { CI } = process.env;

/**
 * exec sync and redirect output to stdio
 */
function exec(cmd) {
  console.log('RUN', cmd);
  return execSync(cmd, { stdio: [0, 1, 1] });
}

/**
 *  fetching the commit SHA
 */
function getCommitSHA() {
  // the repo is in the detached state for CI
  // we need to take one commit before to take a commit that has been associated to the PR
  const lastCommits = execSync('git log -n 2 --pretty=oneline')
    .toString()
    .split('\n')
    .map(log => log.split(' ')[0]);

  return CI ? lastCommits[1] : lastCommits[0];
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

function checkoutBranch(branchName, baseBranch, config) {
  const branchPath = `${config.dist}/${branchName}`;
  if (!fs.existsSync(branchPath)) fs.mkdirSync(branchPath);
  const checkoutTarget = branchName === 'current' ? getCommitSHA() : branchName;
  fs.removeSync(config.compiledTestsDist);
  exec('git reset --hard');
  exec(`git checkout ${checkoutTarget}`);
  if (branchName !== baseBranch) {
    // the base branch may have changes, so merge it
    exec(`git pull origin ${baseBranch}`);
  }
  exec('yarn install --frozen-lockfile --check-files');
  exec('yarn ci:compile');

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
