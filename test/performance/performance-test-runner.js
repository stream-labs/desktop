require('dotenv').config();
const { checkoutBranch, getCommitSHA, getCommitInfo, exec } = require('../helpers/repo');
const fs = require('fs-extra');
const { GithubClient } = require('../../scripts/github-client');
const path = require('path');
const { CI, SLOBS_TEST_USER_POOL_TOKEN, BUILD_REASON } = process.env;
const CONFIG = require('./config.json');
const args = process.argv.slice(2);
const rimraf = require('rimraf');
const Table = require('cli-table');
const colors = require('colors');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { execSync } = require('child_process');

const TESTS_SERVICE_URL = CI ? 'https://slobs-users-pool.herokuapp.com' : 'http://localhost:5000';

(async function main() {
  console.log('Start performance test on', getCommitSHA());

  // run tests
  const testResults = runTests();

  // get base branch timings
  const baseBranchTestResults = await getBaseBranchResults();
  if (baseBranchTestResults) {
    printResults(baseBranchTestResults, testResults);
  }

  // save results to DB if needed
  const needToSaveResults = BUILD_REASON === 'IndividualCI';
  if (needToSaveResults) await sendResults(testResults);
})();

async function getBaseBranchResults() {
  // on CI get results from DB instead running tests on base branch
  // this saves a lot of time
  if (CI) {
    console.log('Compare testing results with last branch results from DB');
    const baseBranchTestResults = await fetchLastResultsForBaseBranch();
    console.log('commit', baseBranchTestResults.commit);
    return baseBranchTestResults.tests;
  }

  // otherwise run tests locally
  exec(`git checkout ${CONFIG.baseBranch}`);
  return runTests(true);
}

function runTests(installNodeModules = false) {
  // prepare dirs
  const resultsPath = path.resolve(CONFIG.dist, 'performance-results.json');
  fs.removeSync(CONFIG.dist);
  fs.mkdirSync(CONFIG.dist, { recursive: true });
  fs.removeSync(resultsPath);
  fs.removeSync(CONFIG.compiledTestsDist);

  // install deps
  if (installNodeModules) {
    exec('yarn install');
    exec('yarn compile');
  }

  const runTestsCmd = `yarn test:file ${
    CONFIG.compiledTestsDist
  }/performance/tests/**/*.js ${args.join(' ')}`;
  exec(runTestsCmd);
  const testResults = fs.readJsonSync(resultsPath);
  return testResults;
}

/**
 * Compare results from 2 branches and show them as a table
 */
function printResults(baseBranchResults, currentBranchResults) {
  // iterate throw each test
  Object.keys(baseBranchResults).forEach(testName => {
    const baseBranchMetrics = baseBranchResults[testName];
    console.log(`${testName}`);

    // define table columns
    const table = new Table({
      head: ['METRIC', 'UNITS', 'RECORDS', 'BASE BRANCH AVG', 'CURRENT BRANCH AVG', 'DIFF %'],
      colWidths: [35, 10, 9, 17, 20, 20],
    });

    // iterate through each metric
    Object.keys(baseBranchMetrics).forEach(metricName => {
      const baseMetric = baseBranchMetrics[metricName];
      const currentMetric = currentBranchResults[testName]
        ? currentBranchResults[testName][metricName]
        : null;
      const baseMetricValues = baseMetric.values;
      const baseMetricAvg = baseMetricValues.reduce((v1, v2) => v1 + v2) / baseMetricValues.length;
      let currentMetricValues = 'null';
      let currentMetricAvg = 'null';
      let diff = 'null';
      let diffPercent = 'null';
      if (currentMetric) {
        currentMetricValues = currentMetric.values;
        currentMetricAvg =
          currentMetricValues.reduce((v1, v2) => v1 + v2) / currentMetricValues.length;
        diff = baseMetricAvg / currentMetricAvg;
        diffPercent = (1 - diff) * 100;
      }

      // create table row
      table.push([
        metricName,
        baseMetric.units,
        baseMetricValues.length,
        baseMetricAvg,
        currentMetricAvg,
        formatPerformanceValue(diffPercent),
      ]);
    });
    console.log(table.toString());
  });
}

/**
 * Round value to max 5 digits after point and add color
 */
function formatPerformanceValue(val) {
  if (val === 'null') return 'null';
  val = Number(val.toFixed(5));
  return val > 0 ? colors.red(`+${val}`) : colors.green(val);
}

/**
 * Send tests results to performance-analytics
 */
async function sendResults(tests) {
  const url = CI ? 'https://slobs-users-pool.herokuapp.com' : 'http://localhost:5000';
  const commit = getCommitInfo(getCommitSHA());
  const body = {
    date: Date.now(),
    isTestingData: !CI,
    commit,
    tests,
  };
  console.log('Send results for commit', commit);
  fetch(`${url}/performance`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SLOBS_TEST_USER_POOL_TOKEN}`,
    },
  })
    .then(_ => console.log('Testing results for the base bch have been sent to analytics'))
    .catch(e => console.error('Sending results to analytics failed', e));
}

async function fetchLastResultsForBaseBranch() {
  const resp = await fetch(`${TESTS_SERVICE_URL}/performance?includeTestingData=false&limit=1`, {
    headers: {
      Authorization: `Bearer ${SLOBS_TEST_USER_POOL_TOKEN}`,
    },
  });
  const results = await resp.json();
  return results[0];
}

function baseBranchHasCommit(commitSHA) {
  return (
    execSync(`git branch --contains ${commitSHA}`).toString().indexOf(`* ${CONFIG.baseBranch}`) !==
    -1
  );
}
