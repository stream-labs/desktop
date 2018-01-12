const rimraf = require('rimraf');
const { execSync } = require('child_process');
const fs = require('fs');

const CONFIG = JSON.parse(fs.readFileSync('test/screentest/config.json'));

const branches = [
  execSync('git status').toString().replace('On branch ', '').split('\n')[0],
  CONFIG.baseBranch
];

(function main() {

  const dir = CONFIG.dist;
  rimraf.sync(dir);
  fs.mkdirSync(dir);


  for (const branchName of branches) {

    execSync(`git checkout ${branchName}`);

    fs.mkdirSync(`${dir}/${branchName}`);

    log('project compilation');
    try {
      execSync('yarn compile');
    } catch (e) {
      err('compilation failed', e);
      return;
    }

    log('tests compilation');

    try {
      execSync('yarn compile-tests');
    } catch (e) {
      err('compilation failed', e);
      return;
    }

    log('creating screenshots');
    try {
      execSync(`yarn ava test-dist/test/screentest/tests`);
    } catch (e) {
      err('creating screenshots failed');
      return;
    }

  }

  execSync(`git checkout ${branches[0]}`);

  log('comparing screenshots');
  try {
    execSync(`node test-dist/test/screentest/comparator.js ${branches[0]} ${branches[1]}`);
  } catch (e) {
    err('comparing screenshots failed');
    return;
  }

})();

execSync(`git checkout ${branches[0]}`);


function log(...args) {
  console.log(...args);
}

function err(...args) {
  console.error(...args);
}

