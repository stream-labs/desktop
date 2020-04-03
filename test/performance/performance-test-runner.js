require('dotenv').config();
const { checkoutBranch, getCommitSHA, getCommitInfo, exec } = require('../helpers/repo');
const fs = require('fs-extra');
const { GithubClient } = require('../../scripts/github-client');
const path = require('path');
const { CI, SLOBS_TEST_USER_POOL_TOKEN } = process.env;
const CONFIG = require('./config.json');
const args = process.argv.slice(2);
const rimraf = require('rimraf');
const Table = require('cli-table');
const colors = require('colors');
const fetch = require('node-fetch');
const { execSync } = require('child_process');

const TESTS_SERVICE_URL = CI ? 'https://slobs-users-pool.herokuapp.com' : 'http://localhost:5000';

(async function main() {
  // prepare the dist dir
  fs.removeSync(CONFIG.dist);
  fs.mkdirSync(CONFIG.dist, { recursive: true });
  const runTestsCmd = `yarn test ${CONFIG.compiledTestsDist}/performance/tests/**/*.js ${args.join(
    ' ',
  )}`;
  const resultsPath = path.resolve(CONFIG.dist, 'performance-results.json');

  // const baseBranchTestResults = {
  //   'Empty collection': {
  //     mainWindowShow: { values: [1, 2, 3], units: 'ms' },
  //     sceneCollectionLoad: { units: 'ms', values: [1, 2, 3, 4] },
  //     bundleSize: { units: 'bite', values: [1, 2, 3, 4] },
  //   },
  //   'Empty collection 2': {
  //     mainWindowShow: { values: [1, 2, 3], units: 'ms' },
  //     sceneCollectionLoad: { units: 'ms', values: [1, 2, 3, 4, 5] },
  //     bundleSize: { units: 'bite', values: [1, 2, 3, 4, 1, 1] },
  //   },
  // };
  //
  // const testResults = {
  //   'Empty collection': {
  //     mainWindowShow: { values: [1, 2, 3], units: 'ms' },
  //     sceneCollectionLoad: { units: 'ms', values: [1, 2, 3, 4, 5] },
  //     bundleSize: { units: 'bite', values: [1, 2, 3, 4, 1, 1] },
  //   },
  //   'Empty collection 2': {
  //     mainWindowShow: { values: [1, 2, 3], units: 'ms' },
  //     // sceneCollectionLoad: { units: 'ms', values: [1, 2, 3, 4, 5] },
  //     bundleSize: { units: 'bite', values: [1, 2, 3, 4, 1, 1] },
  //   },
  // };

  exec(runTestsCmd);
  const testResults = fs.readJsonSync(resultsPath);

  const baseBranchTestResults = (await fetchLastResultsForBaseBranch()).tests;

  if (baseBranchTestResults) {
    console.log('Comparing testing results with last base branch results');
    console.log(baseBranchTestResults.commit);
    printResults(baseBranchTestResults, testResults);
  }

  const needToSaveResults = true; // baseBranchHasCommit(getCommitSHA());
  if (needToSaveResults) await sendResults(testResults);
})();

/**
 * Compare results from 2 branches and show them as a table
 */
function printResults(baseBranchResults, currentBranchResults) {
  const comparisonResults = {};

  // iterate throw each test
  Object.keys(baseBranchResults).forEach(testName => {
    const baseBranchMetrics = baseBranchResults[testName];
    console.log(`${testName}`);

    // define table columns
    const table = new Table({
      head: ['METRIC', 'UNITS', 'RECORDS', 'BASE BRANCH AVG', 'CURRENT BRANCH AVG', 'DIFF %'],
      colWidths: [35, 10, 9, 17, 20, 20],
    });

    // iterate thow each metric
    Object.keys(baseBranchMetrics).forEach(metricName => {
      if (!comparisonResults[testName]) comparisonResults[testName] = {};
      const baseMetric = baseBranchMetrics[metricName];
      const currentMetric = currentBranchResults[testName]
        ? currentBranchResults[testName][metricName]
        : null;
      comparisonResults[testName][metricName] = {
        baseMetric,
        currentMetric,
      };
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

function formatPerformanceValue(val) {
  if (val === 'null') return 'null';
  val = Number(val.toFixed(5));
  return val > 0 ? colors.red(`+${val}`) : colors.green(val);
}

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
  const resp = await fetch(`${TESTS_SERVICE_URL}/performance?includeTestingData=true&limit=1`, {
    headers: {
      Authorization: `Bearer ${SLOBS_TEST_USER_POOL_TOKEN}`,
    },
  });
  const results = await resp.json();
  return results[0];
}

function baseBranchHasCommit(commitSHA) {
  return (
    execSync(`git branch --contains ${commitSHA}`)
      .toString()
      .indexOf(`* ${CONFIG.baseBranch}`) !== -1
  );
}
