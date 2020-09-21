/**
 * Tests runner script:
 * - fetch average test timings from the DB
 * - run tests
 * - if some tests failed retry only these tests
 */

const { execSync } = require('child_process');
const fs = require('fs');
const rimraf = require('rimraf');
const request = require('request');
const fetch = require('node-fetch');

const failedTestsFile = 'test-dist/failed-tests.json';
const args = process.argv.slice(2);
const TIMEOUT = 3; // timeout in minutes

(async function main() {
  try {
    rimraf.sync(failedTestsFile);
    await createTestTimingsFile();
    execSync(`yarn test --timeout=${TIMEOUT}m ` + args.join(' '), { stdio: [0, 1, 2] });
  } catch (e) {
    console.log(e);
    retryTests();
  }
})();

function retryTests() {
  log('retrying failed tests');

  if (!fs.existsSync(failedTestsFile)) {
    throw 'no tests to retry';
  }

  const failedTests = JSON.parse(fs.readFileSync(failedTestsFile, 'utf8'));
  const retryingArgs = failedTests.map(testName => `--match="${testName}"`);
  let retryingFailed = false;
  try {
    execSync(`yarn test --timeout=${TIMEOUT}m ` + args.concat(retryingArgs).join(' '), {
      stdio: [0, 1, 2],
    });
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
            uuid: 'test environment',
          },
        ],
      },
    };

    const callback = error => {
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

/**
 * Fetch average execution timings for tests from DB
 * and save results to a file
 */
async function createTestTimingsFile() {
  const utilsServerUrl = 'https://slobs-users-pool.herokuapp.com';
  const token = process.env.SLOBS_TEST_USER_POOL_TOKEN;
  const testTimingsFile = 'test-dist/test-timings.json';
  rimraf.sync(testTimingsFile);

  return new Promise((resolve, reject) => {
    fetch(`${utilsServerUrl}/testStats`, {
      method: 'get',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
      .then(res => {
        if (res.status !== 200) {
          reject('Unable to request the utility server', res);
        } else {
          res.json().then(data => {
            if (!fs.existsSync('test-dist')) {
              fs.mkdirSync('test-dist');
            }
            fs.writeFileSync(testTimingsFile, JSON.stringify(data));
            resolve();
          });
        }
      })
      .catch(e => reject(`Utility server is not available ${e}`));
  });
}
