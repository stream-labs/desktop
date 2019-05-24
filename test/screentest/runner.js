const rimraf = require('rimraf');
const { execSync } = require('child_process');
const fs = require('fs');
const env = process.env;
const { GithubClient } = require('../../scripts/github-client');

const CONFIG = JSON.parse(fs.readFileSync('test/screentest/config.json'));

const branches = [
  'current',
  CONFIG.baseBranch
];

const redirectIo = { stdio: [0, 1, 2] }

const returnCode = (function main() {

  log('update check');
  updateCheck();

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
      execSync('yarn compile:ci', redirectIo);
    } catch (e) {
      err('compilation failed', e);
      return 1;
    }

    log('tests compilation');

    try {
      execSync('yarn compile-tests', redirectIo);
    } catch (e) {
      err('compilation failed', e);
      return 1;
    }

    log('creating screenshots');
    try {
      execSync(`yarn ava test-dist/test/screentest/tests --match="Settings*"`, redirectIo);
    } catch (e) {
      err('creating screenshots failed');
      return 1;
    }

  }

  checkoutBranch(branches[0], true);


  log('comparing screenshots');
  try {
    execSync(`node test-dist/test/screentest/comparator.js ${branches[0]} ${branches[1]}`, redirectIo);
  } catch (e) {
    err('comparing screenshots failed');
    return 1;
  }

  log('switch screenshots');
  try {
    execSync(`node test-dist/test/screentest/comparator.js ${branches[0]} ${branches[1]}`, redirectIo);
  } catch (e) {
    err('comparing screenshots failed');
    return 1;
  }

  return 0;
})();

if (returnCode !== 0) {
  process.exit(1);
}

checkoutBranch(branches[0]);


function log(...args) {
  console.log(...args);
}

function err(...args) {
  console.error(...args);
}

function checkoutBranch(branchName, skipModulesInstallation = false) {
  const branchPath = `${CONFIG.dist}/${branchName}`;
  if (!fs.existsSync(branchPath)) fs.mkdirSync(branchPath);
  if (branchName !== 'current') {
    log(`checkout ${branchName}`);
    execSync(`git checkout ${branchName}`, redirectIo);

    if (!skipModulesInstallation) {
      log('run yarn install');
      execSync('yarn install --frozen-lockfile --check-files');
    }
  }
  fs.writeFileSync(`${CONFIG.dist}/current-branch.txt`, branchName);
}



async function updateCheck() {

  console.log('run update');

  console.log(
    env.STREAMLABS_BOT_ID,
      env.STREAMLABS_BOT_KEY,
      'stream-labs',
      env.BUILD_REPOSITORY_NAME
  );

  const github = new GithubClient(
    env.STREAMLABS_BOT_ID,
    env.STREAMLABS_BOT_KEY,
    'stream-labs',
    env.BUILD_REPOSITORY_NAME
  );

  await github.login();

  console.log('commit', env.Build.SourceVersion);
  await github.postCheck({
    head_sha: env.Build.SourceVersion,
    status: 'in_progress',
    output: {
      title: 'This is a title ' + new Date()
    }
  });


}


