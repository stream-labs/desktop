/**
 * Tests runner script:
 * - run tests
 * - if some tests failed retry anly these tests
 */
// TODO: collect statistics about flaky tests

const { execSync } = require('child_process');
const fs = require('fs');
const rimraf = require('rimraf');

const failedTestsFile = 'test-dist/failed-tests.json';
const args = process.argv.slice(2);

const returnCode = (function main() {

  try {
    rimraf.sync(failedTestsFile);
    execSync('yarn test ' + args.join(' '), { stdio: [0, 1, 2] });
  } catch (e) {
    if (!retryTests()) return 1;
  }
  return 0;
})();


function retryTests() {
  log('retrying failed tests');

  if (!fs.existsSync(failedTestsFile)) {
    log('no tests to retry');
    return false;
  }

  const failedTests = JSON.parse(fs.readFileSync(failedTestsFile));
  const retryingArgs = failedTests.map(testName => `--match="${testName}"`);
  try {
    execSync('yarn test ' + args.concat(retryingArgs).join(' '), { stdio: [0, 1, 2] });
  } catch (e) {
    log('failed to retry tests');
    return false;
  }

  log('retrying succeed');
  return true;
}

if (returnCode !== 0) {
  process.exit(1);
}

function log(...args) {
  console.log(...args);
}
