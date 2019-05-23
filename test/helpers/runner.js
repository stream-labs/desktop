/**
 * Tests runner script:
 * - run tests
 * - if some tests failed retry only these tests
 */

const { execSync } = require('child_process');
const fs = require('fs');
const rimraf = require('rimraf');
const request = require('request');

const failedTestsFile = 'test-dist/failed-tests.json';
const args = process.argv.slice(2);

(function main() {
  try {
    rimraf.sync(failedTestsFile);
    execSync('yarn test ' + args.join(' '), { stdio: [0, 1, 2] });
  } catch (e) {
    retryTests();
  }
})();


function retryTests() {
  log('retrying failed tests');

  if (!fs.existsSync(failedTestsFile)) {
    throw 'no tests to retry';
  }

  const failedTests = JSON.parse(fs.readFileSync(failedTestsFile));
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

function sendFailedTestsToAnalytics(failedTests) {
  log('Sending analytics..');
  return new Promise((resolve, reject) => {

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
}
