const rimraf = require('rimraf');
const { execSync } = require('child_process');
const fs = require('fs');

const CONFIG = JSON.parse(fs.readFileSync('test/screentest/config.json'));
const commit = execSync('git log').toString().split('\n')[0].split(' ')[1];
const currentBranch = execSync(`git branch --contain ${commit}`)
  .split('\n')
  .find(branchInfo => branchInfo.indexOf('HEAD detached ') === -1)
  .replace(' ', '')
  .replace('*', '');


const branches = [
  currentBranch,
  CONFIG.baseBranch
];

(function main() {

  log('use branches', branches);

  const dir = CONFIG.dist;
  rimraf.sync(dir);

  // create dir
  let currentPath = '';
  dir.split('/').forEach(dirName => {
    currentPath += dirName;
    if (!fs.existsSync(currentPath)) fs.mkdirSync(currentPath);
    currentPath += '/';
  });


  for (const branchName of branches) {


    checkoutBranch(branchName);


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

  checkoutBranch(branches[0]);

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

function checkoutBranch(branchName) {
  fs.mkdirSync(`${CONFIG.dir}/${branchName}`);
  execSync(`git checkout ${branchName}`);
  fs.writeFileSync(`${CONFIG.dir}/current-branch.txt`, branchName);
}
