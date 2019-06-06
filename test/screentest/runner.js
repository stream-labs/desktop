require('dotenv').config();
const rimraf = require('rimraf');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');
const uuid = require('uuid');
const recursiveReadDir = require('recursive-readdir');
const { GithubClient } = require('../../scripts/github-client');
const {
  AWS_ACCESS_KEY,
  AWS_SECRET_KEY,
  AWS_BUCKET,
  CI,
  STREAMLABS_BOT_ID,
  STREAMLABS_BOT_KEY,
  BUILD_REPOSITORY_NAME,
  BUILD_BUILD_ID,
} = process.env;
const CONFIG = require('./config.json');
const commitSHA = getCommitSHA();
const args = process.argv.slice(2);

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
    checkoutBranch(branchName);
    exec(`yarn test --timeout=3m ${CONFIG.compiledTestsDist}/screentest/tests ${args.join(' ')}`);
  }

  // compare screenshots
  exec(`node ${CONFIG.dist}/comparator.js ${branches[0]} ${branches[1]}`);

  // send the status to the GitHub check and upload screenshots
  await updateCheck();
})();


function checkoutBranch(branchName) {
  const branchPath = `${CONFIG.dist}/${branchName}`;
  if (!fs.existsSync(branchPath)) fs.mkdirSync(branchPath);
  if (branchName !== 'current') {
    exec(`git checkout ${branchName}`);
  }
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
    screenshotsUrl = await uploadScreenshots();
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

async function uploadScreenshots() {
  if (!AWS_ACCESS_KEY || !AWS_SECRET_KEY || !AWS_BUCKET) {
    console.error('Setup AWS_ACCESS_KEY AWS_SECRET_KEY AWS_BUCKET to upload screenshots');
    return;
  }

  console.info(`Uploading screenshots to the s3 bucket`);
  const Bucket = AWS_BUCKET;
  const awsCredentials = new AWS.Credentials(AWS_ACCESS_KEY, AWS_SECRET_KEY);
  const s3Options = {credentials : awsCredentials};
  const s3Client = new AWS.S3(s3Options);
  const bucketDir = BUILD_BUILD_ID || uuid();

  try {
    const files = await recursiveReadDir(CONFIG.dist);
    for (const filePath of files) {
      console.info(`uploading ${filePath}`);
      const relativePath = path.relative(CONFIG.dist, filePath).replace('\\', '/');
      const stream = fs.createReadStream(filePath);
      const params = {
        Bucket,
        Key : `${bucketDir}/${relativePath}`,
        ContentType: 'text/html',
        ACL : 'public-read',
        Body : stream
      };
      await s3Client.upload(params).promise();
    }
    const url = `http://${Bucket}.s3.amazonaws.com/${bucketDir}/preview.html`;
    console.info('Screenshots uploaded', url);
    return url;
  } catch (e) {
    console.error('Failed to upload screenshots');
    console.error(e);
  }

}
