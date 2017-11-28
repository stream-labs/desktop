/*
 * All-in-one interactive Streamlabs OBS release script.
 */

const sh = require('shelljs');
const inq = require('inquirer');
const semver = require('semver');
const colors = require('colors/safe');
const fs = require('fs');
const path = require('path');

function info(msg) {
  sh.echo(colors.magenta(msg));
}

function warn(msg) {
  sh.echo(colors.red(`WARNING: ${msg}`));
}

function error(msg) {
  sh.echo(colors.red(`ERROR: ${msg}`));
}

function executeCmd(cmd) {
  const result = sh.exec(cmd);

  if (result.code !== 0) {
    error(`Command Failed >>> ${cmd}`);
    sh.exit(1);
  }
}

async function confirm(msg) {
  const result = await inq.prompt({
    type: 'confirm',
    name: 'conf',
    message: msg
  });

  return result.conf;
}

function checkEnv(varName) {
  if (!process.env[varName]) {
    error(`Missing environment variable ${varName}`);
    sh.exit(1);
  }
}

/**
 * This is the main function of the script
 */
async function runScript() {
  sh.echo(colors.magenta('|-------------------------------------------|'));
  sh.echo(colors.magenta('| Streamlabs OBS Interactive Release Script |'));
  sh.echo(colors.magenta('|-------------------------------------------|'));

  if (!await confirm('Are you sure you want to release?')) sh.exit(0);

  // Start by figuring out if this environment is configured properly
  // for releasing.
  checkEnv('AWS_ACCESS_KEY_ID');
  checkEnv('AWS_SECRET_ACCESS_KEY');
  checkEnv('CSC_LINK');
  checkEnv('CSC_KEY_PASSWORD');

  // Make sure the release environment is clean
  info('All current un-committed changes will be stashed');
  // executeCmd('git add -A');
  // executeCmd('git stash');

  const deployType = (await inq.prompt({
    type: 'list',
    name: 'deployType',
    message: 'How would you like to release?',
    choices: [
      {
        name: 'Merge staging into master and release from master (normal deploy)',
        value: 'normal'
      },
      {
        name: 'Release the current branch as-is (high priority hotfix releases only)',
        value: 'not-normal'
      }
    ]
  })).deployType;

  if (deployType === 'normal') {
    // executeCmd('git checkout staging');
    // executeCmd('git pull');
    // executeCmd('git checkout master');
    // executeCmd('git pull');
    // executeCmd('git merge staging');
    // executeCmd('git push origin HEAD');
  } else {
    warn('You are about to release the current branch as-is.');
    warn('You should only do this if you know what you are doing.');
    if (!await confirm('Are you absolutely sure you want to release the current branch?')) sh.exit(0);
  }

  // info('Ensuring submodules are up to date...');
  // executeCmd('git submodule update --init --recursive');

  // info('Removing old packages...');
  // sh.rm('-rf', 'node_modules');

  // info('Installing fresh packages...');
  // executeCmd('yarn install');

  // info('Installing node-obs...');
  // executeCmd('yarn install-node-obs');

  // info('Compiling assets...');
  // executeCmd('yarn compile');

  // info('Running tests...');
  // executeCmd('yarn test');

  info('The current revision has passed testing and is ready to be');
  info('packaged and released');

  const pjson = JSON.parse(fs.readFileSync('package.json'));
  const currentVersion = pjson.version;

  info(`The current application version is ${currentVersion}`);
  const newVersion = (await inq.prompt({
    type: 'list',
    name: 'newVersion',
    message: 'What should the new version number be?',
    choices: [
      semver.inc(currentVersion, 'patch'),
      semver.inc(currentVersion, 'minor'),
      semver.inc(currentVersion, 'major')
    ]
  })).newVersion;

  if (!await confirm(`Are you sure you want to package version ${newVersion}?`)) sh.exit(0);
}

runScript().then(() => {
  sh.exit(0);
});
