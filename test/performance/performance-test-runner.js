require('dotenv').config();
const { checkoutBranch, getCommitSHA, exec } = require('../helpers/repo');
const fs = require('fs-extra');
const { GithubClient } = require('../../scripts/github-client');
const path = require('path');
const { CI, STREAMLABS_BOT_ID, STREAMLABS_BOT_KEY, BUILD_REPOSITORY_NAME } = process.env;
const CONFIG = require('./config.json');
const commitSHA = getCommitSHA();
const args = process.argv.slice(2);
const rimraf = require('rimraf');
const Table = require('cli-table');
const colors = require('colors');

(async function main() {
  // prepare the dist dir
  fs.removeSync(CONFIG.dist);
  fs.mkdirSync(CONFIG.dist, { recursive: true });
  const runTestsCmd = `yarn test-flaky ${
    CONFIG.compiledTestsDist
  }/performance/tests/**/*.js ${args.join(' ')}`;
  const resultsPath = path.resolve(CONFIG.dist, 'performance-results.json');

  // checkout the base branch
  checkoutBranch(CONFIG.baseBranch, CONFIG);
  exec(runTestsCmd);

  // read test results
  const baseBranchResults = fs.readJsonSync(resultsPath);
  console.log('baseBranchResults', baseBranchResults);

  // return to the current branch
  fs.removeSync(resultsPath);
  checkoutBranch('current', CONFIG);
  exec(runTestsCmd);
  const currentBranchResults = fs.readJsonSync(resultsPath);
  console.log('currentBranchResults', currentBranchResults);

  // const baseBranchResults = {
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
  // const currentBranchResults = {
  //   'Empty collection': {
  //     mainWindowShow: { values: [1, 2, 3], units: 'ms' },
  //     sceneCollectionLoad: { units: 'ms', values: [1, 2, 3, 4, 5] },
  //     bundleSize: { units: 'bite', values: [1, 2, 3, 4, 1, 1] },
  //   },
  //   'Empty collection 2': {
  //     mainWindowShow: { values: [1, 2, 3], units: 'ms' },
  //     sceneCollectionLoad: { units: 'ms', values: [1, 2, 3, 4, 5] },
  //     bundleSize: { units: 'bite', values: [1, 2, 3, 4, 1, 1] },
  //   },
  // };

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

async function updateCheck() {
  if (!STREAMLABS_BOT_ID || !STREAMLABS_BOT_KEY) {
    console.info(
      'STREAMLABS_BOT_ID or STREAMLABS_BOT_KEY is not set. Skipping GitCheck status update',
    );
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
    title =
      `${testResults.totalScreens} screenshots have been checked.` +
      '\n' +
      `${testResults.newScreens} new screenshots have been found`;
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
      conclusion: 'success',
      completed_at: new Date().toISOString(),
      details_url: screenshotsUrl || 'https://github.com/stream-labs/streamlabs-obs',
      output: {
        title,
        summary: '',
      },
    });
  } catch (e) {
    console.error('Unable to update GithubCheck status');
    console.error(e);
  }
}
