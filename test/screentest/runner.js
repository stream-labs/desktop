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

  await updateCheck();

  rimraf.sync(CONFIG.dist);
  fs.mkdirSync(CONFIG.dist, { recursive: true });


  // make screenshots for each branch
  for (const branchName of branches) {
    checkoutBranch(branchName);
    // TODO: run all tests, not only for settings
    exec('yarn test --timeout=3m test-dist/test/screentest/tests --match="Settings*" ');
  }

  // compare screenshots
  execSync(`node test-dist/test/screentest/comparator.js ${branches[0]} ${branches[1]}`);

  // send the status to the GitHub check
  await updateCheck();
})();


function checkoutBranch(branchName) {
  const branchPath = `${CONFIG.dist}/${branchName}`;
  if (!fs.existsSync(branchPath)) fs.mkdirSync(branchPath);
  if (branchName !== 'current') {
    exec(`git checkout ${branchName}`);
  }
  exec('yarn install --frozen-lockfile --check-files');
  exec('yarn compile:ci');
  // save current branch name to the file
  // screenshoter needs will use this value
  fs.writeFileSync(`${CONFIG.dist}/current-branch.txt`, branchName);
}


async function updateCheck() {

  if (!env.STREAMLABS_BOT_ID || !env.STREAMLABS_BOT_KEY) {
    console.info('STREAMLABS_BOT_ID or STREAMLABS_BOT_KEY is not set. Skipping GitCheck status update');
    return;
  }

  // try to read test results from the file
  let testResults = null;
  try {
    testResults = require('../../test-dist/screentest/state.json');
  } catch (e) {
    console.error('No results found for screentest');
  }

  let conclusion = '';
  let title = '';
  if (!testResults) {
    conclusion = 'failure';
    title = 'Tests failed';
  } else if (testResults.changedScreens) {
    conclusion = 'action_required';
    title = `Changes are detected in ${testResults.changedScreens} screenshots`;
  } else {
    conclusion = 'success';
    title = `Checked ${testResults.totalScreens} screenshots, ${testResults.newScreens} new screenshots found`
  }


  console.info('Updating the GithubCheck check');

  // AzurePipelines doesn't support multiline variables.
  // All new-line characters are replaced with `;`
  const botKey = env.STREAMLABS_BOT_KEY.replace(/;/g, '\n');

  const [owner, repo] = env.BUILD_REPOSITORY_NAME.split('/');
  const github = new GithubClient(env.STREAMLABS_BOT_ID, botKey, owner, repo);

  try {
    await github.login();
    await github.postCheck({
      name: 'Screenshots',
      head_sha: commitSHA,
      conclusion,
      completed_at: new Date().toISOString(),
      details_url: env.BUILD_BUILD_URI || 'https://github.com/stream-labs/streamlabs-obs',
      output: {
        title: title,
        summary: ''
      }
    });
  } catch (e) {
    console.error('Unable to update GithubCheck status');
    console.error(e);
  }

}


