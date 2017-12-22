import * as rimraf from 'rimraf';

const { execSync } = require('child_process');
const fs = require('fs');

const BRANCH_TO_COMPARE = 'regression_testing_screenshots_example';

const branches = [
  execSync('git status').toString().replace('On branch ', '').split('\n')[0],
  BRANCH_TO_COMPARE
];

(function main() {




  const dir = 'test-dist/screentest';
  rimraf(dir);
  fs.mkdirSync(dir);


  branches.forEach(branchName => {

    execSync(`git checkout ${branchName}`);

    fs.mkdirSync(`${dir}/${branchName}`);

    log('project compilation');
    try {
      execSync('yarn compile')
    } catch (e) {
      err('compilation failed', e);
      return;
    }

    log('tests compilation');

    try {
      execSync('yarn compile-tests')
    } catch (e) {
      err('compilation failed', e);
      return;
    }

    log('creating screenshots');
    try {
      execSync('yarn ava test-dist/test/screentest/tests/*.js');
    } catch (e) {
      err('creating screenshots failed');
      return;
    }

  });

})();

execSync(`git checkout ${branches[0]}`);


function log(...args) {
  console.log(...args);
}

function err(...args) {
  console.error(...args);
}

