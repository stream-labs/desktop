require('dotenv').config();
import { checkoutBranch, getCommitSHA, exec } from '../helpers/repo';
const fs = require('fs');
const { GithubClient } = require('../../scripts/github-client');
const path = require('path');
const { CI, STREAMLABS_BOT_ID, STREAMLABS_BOT_KEY, BUILD_REPOSITORY_NAME } = process.env;
const CONFIG = require('./config.json');
const commitSHA = getCommitSHA();
const args = process.argv.slice(2);
const rimraf = require('rimraf');

(async function main() {
  // prepare the dist dir
  fs.removeSync(CONFIG.dist);
  fs.mkdirSync(CONFIG.dist, { recursive: true });
  const runTestsCmd = `yarn test-flaky ${
    CONFIG.compiledTestsDist
  }/performance/tests/**/*.js ${args.join(' ')}`;
  const resultsPath = path.resolve(CONFIG.dist, 'performance-results.json');

  // checkout the base branch
  checkoutBranch(CONFIG.baseBranch);
  exec(runTestsCmd);

  // read test results
  const baseBranchResults = fs.readJsonSync(resultsPath);

  // return to the current branch
  fs.removeSync(resultsPath);
  checkoutBranch('current');
  exec(runTestsCmd);
  const currentBranchResults = fs.readJsonSync(resultsPath);

  printResults(baseBranchResults, currentBranchResults);
})();

function printResults(baseBranchResults, currentBranchResults) {
  const comparisonResults = {};
  Object.keys(baseBranchResults).forEach(testName => {
    const baseBranchMetrics = baseBranchResults[testName];
    console.log(`TEST ${testName}`);
    Object.keys(baseBranchMetrics).forEach(metricName => {
      if (!comparisonResults[testName]) comparisonResults[testName] = {};
      const baseMetric = baseBranchMetrics[testName][metricName];
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
      const currentMetricAvg = currentMetricValues.reduce((v1, v2) => v1 + v2) / currentMetricValues.length;
      const diff = baseMetricAvg / currentMetricAvg;
      const diffPercent = (1 - diff) * 100;
      console.log('Base', baseMetricAvg, 'Current', currentMetricAvg, 'diff', diffPercent);
    });
  });
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
