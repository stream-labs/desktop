require('dotenv').config();

const rimraf = require('rimraf');
const { execSync } = require('child_process');
const fs = require('fs');
const env = process.env;
const { GithubClient } = require('../../scripts/github-client');
const CONFIG = require('./config.json');

// list branches for making screenshots from
const branches = [
  'current',
  CONFIG.baseBranch
];

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

const commitSHA = execSync('git rev-parse HEAD').toString().replace('\n', '');

(async function main() {

  // send the status to the GitHub check
  await updateCheck();

  rimraf.sync(CONFIG.dist);
  fs.mkdirSync(CONFIG.dist, { recursive: true });


  // make screenshots for each branch
  for (const branchName of branches) {
    checkoutBranch(branchName);
    exec('yarn ava test-dist/test/screentest/tests --match="Settings*"');
  }

  // compare screenshots
  checkoutBranch(branches[0], true);
  execSync(`node test-dist/test/screentest/comparator.js ${branches[0]} ${branches[1]}`);

  // send the status to the GitHub check
  await updateCheck();
})();


function checkoutBranch(branchName) {
  const branchPath = `${CONFIG.dist}/${branchName}`;
  if (!fs.existsSync(branchPath)) fs.mkdirSync(branchPath);
  if (branchName !== 'current') {
    exec(`git checkout ${branchName}`);
    exec('yarn install --frozen-lockfile --check-files');
  }
  // save current branch name to the file
  // screenshoter needs will use this value
  fs.writeFileSync(`${CONFIG.dist}/current-branch.txt`, branchName);
}



async function updateCheck() {

  if (!env.STREAMLABS_BOT_ID) {
    console.info('STREAMLABS_BOT_ID is not set. Skipping GitCheck status update');
    return;
  }

  console.log(
    env.STREAMLABS_BOT_ID,
      env.STREAMLABS_BOT_KEY,
      'stream-labs',
      env.BUILD_REPOSITORY_NAME
  );

  const github = new GithubClient(
    env.STREAMLABS_BOT_ID,
    env.STREAMLABS_BOT_KEY,
    'stream-labs',
    env.BUILD_REPOSITORY_NAME
  );

  try {
    await github.login();
    await github.postCheck({
      head_sha: commitSHA,
      status: 'in_progress',
      output: {
        title: 'This is a title ' + new Date(),
        summary: 'This is a summary text'
      }
    });
  } catch (e) {
    console.error('Unable to update GithubCheck status');
    console.error(e);
  }

}


