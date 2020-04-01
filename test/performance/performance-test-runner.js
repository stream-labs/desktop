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

(async function main() {
  // prepare the dist dir
  fs.removeSync(CONFIG.dist);
  fs.mkdirSync(CONFIG.dist, { recursive: true });
  const runTestsCmd = `yarn test ${CONFIG.compiledTestsDist}/performance/tests/**/*.js ${args.join(
    ' ',
  )}`;
  const resultsPath = path.resolve(CONFIG.dist, 'performance-results.json');

  const baseBranchResults = {
    'Empty collection': {
      mainWindowShow: { values: [1, 2, 3], units: 'ms' },
      sceneCollectionLoad: { units: 'ms', values: [1, 2, 3, 4] },
      bundleSize: { units: 'bite', values: [1, 2, 3, 4] },
    },
    'Empty collection 2': {
      mainWindowShow: { values: [1, 2, 3], units: 'ms' },
      sceneCollectionLoad: { units: 'ms', values: [1, 2, 3, 4, 5] },
      bundleSize: { units: 'bite', values: [1, 2, 3, 4, 1, 1] },
    },
  };

  const currentBranchResults = {
    'Empty collection': {
      mainWindowShow: { values: [1, 2, 3], units: 'ms' },
      sceneCollectionLoad: { units: 'ms', values: [1, 2, 3, 4, 5] },
      bundleSize: { units: 'bite', values: [1, 2, 3, 4, 1, 1] },
    },
    'Empty collection 2': {
      mainWindowShow: { values: [1, 2, 3], units: 'ms' },
      sceneCollectionLoad: { units: 'ms', values: [1, 2, 3, 4, 5] },
      bundleSize: { units: 'bite', values: [1, 2, 3, 4, 1, 1] },
    },
  };

  // // checkout the base branch
  // checkoutBranch(CONFIG.baseBranch, CONFIG);
  // exec(runTestsCmd);
  //
  // // read test results
  // const baseBranchResults = fs.readJsonSync(resultsPath);
  // console.log('baseBranchResults', baseBranchResults);
  //
  // // return to the current branch
  // fs.removeSync(resultsPath);
  // checkoutBranch('current', CONFIG);
  // exec(runTestsCmd);
  // const currentBranchResults = fs.readJsonSync(resultsPath);

  sendBaseBranchResults(baseBranchResults);

  const performanceDelta = printResults(baseBranchResults, currentBranchResults);
  console.log('PERFORMANCE DELTA IS', `${formatPerformanceValue(performanceDelta)}%`);
})();

function printResults(baseBranchResults, currentBranchResults) {
  const comparisonResults = {};
  let performanceDelta = 0;
  Object.keys(baseBranchResults).forEach(testName => {
    const baseBranchMetrics = baseBranchResults[testName];
    console.log(`${testName}`);
    const table = new Table({
      head: ['METRIC', 'UNITS', 'RECORDS', 'BASE BRANCH AVG', 'CURRENT BRANCH AVG', 'DIFF %'],
      colWidths: [35, 10, 9, 17, 20, 20],
    });

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
      const currentMetricValues = currentMetric.values;
      const currentMetricAvg =
        currentMetricValues.reduce((v1, v2) => v1 + v2) / currentMetricValues.length;
      const diff = baseMetricAvg / currentMetricAvg;
      const diffPercent = (1 - diff) * 100;
      performanceDelta += diffPercent;
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
  return performanceDelta;
}

function formatPerformanceValue(val) {
  val = Number(val.toFixed(5));
  return val > 0 ? colors.red(`+${val}`) : colors.green(val);
}

async function sendBaseBranchResults(tests) {
  const url = CI ? 'https://slobs-users-pool.herokuapp.com' : 'http://localhost:5000';
  const commit = getCommitInfo(getCommitSHA());
  const body = {
    date: Date.now(),
    isTestingData: !CI,
    commit,
    tests,
  };
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
