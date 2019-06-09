/**
 * Tests runner script:
 * - run tests
 * - if some tests failed retry only these tests
 * - send analytics of failed tests
 * - send screenshots of failed tests
 */

require('dotenv').config();
const { execSync } = require('child_process');
const fs = require('fs');
const rimraf = require('rimraf');
const request = require('request');
const uuid = require('uuid');
const AwsUploader = require( '../../scripts/aws-uploader').AwsUploader;

const FAILED_TESTS_FILE = 'test-dist/failed-tests.json';
const FAILED_TESTS_SCREENSHOTS_DIR = 'test-dist/failed-tests';
const {
  AWS_ACCESS_KEY,
  AWS_SECRET_KEY,
  AWS_BUCKET,
  CI,
  STREAMLABS_BOT_ID,
  STREAMLABS_BOT_KEY,
  BUILD_REPOSITORY_NAME,
  SYSTEM_PULL_REQUEST_PULL_REQUEST_ID,
} = process.env;
const args = process.argv.slice(2);

(function main() {

  console.log('Pull request id is ', SYSTEM_PULL_REQUEST_PULL_REQUEST_ID);
  console.log('Env', process.env);
  // const failedTests = JSON.parse(fs.readFileSync(FAILED_TESTS_FILE));
  // sendFailedTestsToAnalytics(failedTests)
  // try {
  //   rimraf.sync(FAILED_TESTS_FILE);
  //   execSync('yarn test --timeout=3m ' + args.join(' '), { stdio: [0, 1, 2] });
  // } catch (e) {
  //   retryTests();
  // }
})();


function retryTests() {
  log('retrying failed tests');

  if (!fs.existsSync(FAILED_TESTS_FILE)) {
    throw 'no tests to retry';
  }

  const failedTests = JSON.parse(fs.readFileSync(FAILED_TESTS_FILE));
  const retryingArgs = failedTests.map(testName => `--match="${testName}"`);
  let retryingFailed = false;
  try {
    execSync('yarn test ' + args.concat(retryingArgs).join(' '), { stdio: [0, 1, 2] });
    log('retrying succeed');
  } catch (e) {
    retryingFailed = true;
    log('failed to retry tests');
  }

  sendFailedTestsToAnalytics(failedTests).then(() => {
    if (retryingFailed) failAndExit();
  });

}

function log(...args) {
  console.log(...args);
}

function failAndExit() {
  process.exit(1);
}

async function sendFailedTestsToAnalytics(failedTests) {
  log('Sending analytics..');
  await new Promise((resolve, reject) => {

    const options = {
      url: 'https://r2d2.streamlabs.com/slobs/data/ping',
      json: {
        analyticsTokens: [
          {
            event: 'TESTS_FAILED',
            value: failedTests,
            product: 'SLOBS',
            version: this.version,
            count: 1,
            uuid: 'test environment'
          }
        ]
      }
    };

    const callback = (error) => {
      if (error) {
        console.error('Analytics has not been sent');
        resolve();
        return;
      }
      log('Failed tests has been sent to analytics');
      resolve();
    };

    request(options, callback);
  });

  // upload screenshots of failed tests to the AWS bucket
  if (!AWS_BUCKET) return;
  const bucketDir = uuid();
  const uploader = new AwsUploader(AWS_ACCESS_KEY, AWS_SECRET_KEY, AWS_BUCKET);
  const uploadState = await uploader.uploadDir(FAILED_TESTS_SCREENSHOTS_DIR, bucketDir);
  if (!uploadState) return;

  // create the index.html
  const indexFilePath = `${FAILED_TESTS_SCREENSHOTS_DIR}/index.html`;
  fs.writeFileSync(indexFilePath,
    `<html><body>` +
    uploadState.files.map(src => `<h5>${src}</h5><img src="${src}"/>`).join() +
    `</body></html>`
  );

  // upload index.html
  const url = await uploader.uploadFile(indexFilePath, `${bucketDir}/index.html`);
  log('Preview URL:', url);
}
