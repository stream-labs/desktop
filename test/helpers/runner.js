/**
 * Tests runner script:
 * - fetch average test timings from the DB
 * - run tests
 * - if some tests failed retry only these tests
 * - save failed tests to DB
 */

const { execSync } = require('child_process');
const fs = require('fs');
const rimraf = require('rimraf');
const fetch = require('node-fetch');

const failedTestsFile = 'test-dist/failed-tests.json';
const args = process.argv.slice(2);
const TIMEOUT = 3; // timeout in minutes
const { BUILD_BUILD_ID, SYSTEM_JOB_ID, BUILD_REASON } = process.env;

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
    console.error('no tests to retry');
    failAndExit();
  }

  const failedTests = getFailedTests();
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

function getFailedTests() {
  const failedTests = JSON.parse(fs.readFileSync(failedTestsFile, 'utf8'));
  rimraf.sync(failedTestsFile);
  return failedTests;
}

async function sendFailedTestsToAnalytics(failedTests) {
  const failedAfterRetryTests = getFailedTests();
  const testsToSend = failedTests.map(testName => ({
    name: testName,
    retrySucceeded: !failedAfterRetryTests.includes(testName),
  }));
  log('Sending analytics..');
  const body = {
    tests: testsToSend,
    buildId: BUILD_BUILD_ID,
    jobId: SYSTEM_JOB_ID,
    buildReason: BUILD_REASON,
  };
  log(body);
  try {
    await requestUtilityServer('flakyTests', 'post', body);
  } catch (e) {
    console.error('failed to send failed tests', e);
  }
}

/**
 * Fetch average execution timings for tests from DB
 * and save results to a file
 */
async function createTestTimingsFile() {
  const testTimingsFile = 'test-dist/test-timings.json';
  rimraf.sync(testTimingsFile);

  const data = await requestUtilityServer('testStats');
  if (!fs.existsSync('test-dist')) {
    fs.mkdirSync('test-dist');
  }
  console.log('tests stats', data);
  fs.writeFileSync(testTimingsFile, JSON.stringify(data));
}

async function requestUtilityServer(path, method = 'get', body = null) {
  const utilsServerUrl = 'https://slobs-users-pool.herokuapp.com';
  const token = process.env.SLOBS_TEST_USER_POOL_TOKEN;
  const requestPayload = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
  if (body) requestPayload.body = JSON.stringify(body);
  const response = await fetch(`${utilsServerUrl}/${path}`, requestPayload);

  if (!response.ok) {
    console.error(response.status);
    throw new Error('Unable to request the utility server');
  }
  return response.json();
}
