require('dotenv').config();
import { initAwsUploaderViaEnv } from '../../scripts/aws-uploader';
const rimraf = require('rimraf');
const { execSync } = require('child_process');
const fs = require('fs');
const { GithubClient } = require('../../scripts/github-client');
const {
  CI,
  STREAMLABS_BOT_ID,
  STREAMLABS_BOT_KEY,
  BUILD_REPOSITORY_NAME
} = process.env;
const CONFIG = require('./config.json');
const commitSHA = getCommitSHA();
const args = process.argv.slice(2);
const uploadScreenshotsForFailedTests = require('../helpers/screenshot-uploader')
  .uploadScreenshotsForFailedTests;

(async function main() {

  // prepare the dist dir
  rimraf.sync(CONFIG.dist);
  fs.mkdirSync(CONFIG.dist, { recursive: true });

  // make screenshots for each branch
  const branches = [
    'current',
    CONFIG.baseBranch
  ];
  for (const branchName of branches) {
    // run tests from the branch
    checkoutBranch(branchName);
    try {
      execSync(
        `yarn test --timeout=3m ${CONFIG.compiledTestsDist}/screentest/tests ${args.join(' ')}`,
        { stdio: [0, 1, 2] },
      )
    } catch (e) {
      // if tests failed then upload screenshots of failed tests
      await uploadScreenshotsForFailedTests();
      process.exit(1);
    }
  }

  // return to the current branch
  checkoutBranch('current');

  // compile the test folder
  exec(`tsc -p test`);

  // compare screenshots
  exec(`node ${CONFIG.compiledTestsDist}/screentest/comparator.js ${branches[0]} ${branches[1]}`);

  // send the status to the GitHub check and upload screenshots
  await updateCheck();
})();


function checkoutBranch(branchName) {
  const branchPath = `${CONFIG.dist}/${branchName}`;
  if (!fs.existsSync(branchPath)) fs.mkdirSync(branchPath);
  const checkoutTarget = branchName === 'current' ? commitSHA : branchName;
  exec(`git checkout ${checkoutTarget}`);
  rimraf.sync(CONFIG.compiledTestsDist);
  exec('yarn install --frozen-lockfile --check-files');
  exec('yarn compile:ci');
  // save current branch name to the file
  // screenshoter.js will use this value
  fs.writeFileSync(`${CONFIG.dist}/current-branch.txt`, branchName);
}


async function updateCheck() {

  if (!STREAMLABS_BOT_ID || !STREAMLABS_BOT_KEY) {
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

  // create a conclusion
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
    title = `${testResults.totalScreens} screenshots have been checked.` + `\n` +
            `${testResults.newScreens} new screenshots have been found`;
  }

  // upload screenshots if any changes present
  let screenshotsUrl = '';
  if (conclusion === 'action_required' || testResults.newScreens > 1) {
    const uploader = initAwsUploaderViaEnv();
    const uploadState = uploader.uploadDir(CONFIG.dist, uuid());
    if (uploadState) {
      if (screenshotsUrl) uploadState.baseUrl += '/preview.html';
      console.log('The screenshots preview page is ', screenshotsUrl);
    }
  }

  console.info('Updating the GithubCheck', conclusion, title);

  // AzurePipelines doesn't support multiline variables.
  // All new-line characters are replaced with `;`
  const botKey = STREAMLABS_BOT_KEY.replace(/;/g, '\n');

  const [owner, repo] = BUILD_REPOSITORY_NAME.split('/');
  const github = new GithubClient(STREAMLABS_BOT_ID, botKey, owner, repo);

  try {
    await github.login();
    await github.postCheck({
      name: 'Screenshots',
      head_sha: commitSHA,
      conclusion,
      completed_at: new Date().toISOString(),
      details_url: screenshotsUrl || 'https://github.com/stream-labs/streamlabs-obs',
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
