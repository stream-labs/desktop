/*
 * All-in-one interactive Streamlabs OBS release script.
 */

const sh = require('shelljs');
const inq = require('inquirer');
const semver = require('semver');
const colors = require('colors/safe');
const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');
const ProgressBar = require('progress');
const yml = require('js-yaml');


/**
 * CONFIGURATION
 */
const channel = 'latest';
const s3Bucket = 'streamlabs-obs-dev';
const sentryOrg = 'streamlabs-obs';
const sentryProject = 'streamlabs-obs-dev';


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

function sentryCli(cmd) {
  const sentryPath = path.join('bin', 'release', 'node_modules', 'sentry-cli-binary', 'bin', 'sentry-cli');

  executeCmd(`${sentryPath} releases --org "${sentryOrg}" --project "${sentryProject}" ${cmd}`);
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

async function uploadS3File(name, filePath) {
  info(`Starting upload of ${name}...`);

  const stream = fs.createReadStream(filePath);
  const upload = new AWS.S3.ManagedUpload({
    params: {
      Bucket: s3Bucket,
      Key: name,
      ACL: 'public-read',
      Body: stream
    },
    queueSize: 1
  });

  const bar = new ProgressBar(`${name} [:bar] :percent :etas`, {
    total: 100,
    clear: true
  });

  upload.on('httpUploadProgress', progress => {
    bar.update(progress.loaded / progress.total);
  });

  try {
    await upload.promise();
  } catch (err) {
    error(`Upload of ${name} failed`);
    sh.echo(err);
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
  checkEnv('SENTRY_AUTH_TOKEN');

  // Make sure the release environment is clean
  info('Stashing all uncommitted changes...');
  executeCmd('git add -A');
  executeCmd('git stash');

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
    info('Merging staging into master...');
    executeCmd('git checkout staging');
    executeCmd('git pull');
    executeCmd('git checkout master');
    executeCmd('git pull');
    executeCmd('git merge staging');
  } else {
    warn('You are about to release the current branch as-is.');
    warn('You should only do this if you know what you are doing.');
    if (!await confirm('Are you absolutely sure you want to release the current branch?')) sh.exit(0);
  }

  info('Ensuring submodules are up to date...');
  executeCmd('git submodule update --init --recursive');

  info('Removing old packages...');
  sh.rm('-rf', 'node_modules');

  info('Installing fresh packages...');
  executeCmd('yarn install');

  info('Installing node-obs...');
  executeCmd('yarn install-node-obs');

  info('Compiling assets...');
  executeCmd('yarn compile');

  info('Running tests...');
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

  pjson.version = newVersion;

  info(`Writing ${newVersion} to package.json`);
  fs.writeFileSync('package.json', JSON.stringify(pjson, null, 2));

  // Packaging the app takes a long time and sometimes fails, so we
  // do this step before committing and tagging the release.  This way
  // we can re-run the script without "wasting" a version number.
  info('Packaging the app...');
  executeCmd('yarn package');

  info('Committing changes...');
  executeCmd('git add -A');
  executeCmd(`git commit -m "Release version ${newVersion}"`);

  info('Pushing changes...');
  executeCmd('git push origin HEAD');

  info(`Tagging version ${newVersion}...`);
  executeCmd(`git tag 'v${newVersion}'`);
  executeCmd('git push --tags');

  info(`Version ${newVersion} is ready to be deployed.`);
  info('You can find the packaged app at dist/win-unpacked.');
  info('Please run the packaged application now to ensure it starts up properly.');
  info('When you have confirmed the packaged app works properly, you');
  info('can continue with the deploy.');

  if (!await confirm('Are you ready to deploy?')) {
    warn('The deploy has been canceled, however the release has already been tagged.');
    warn(`${newVersion} should be marked as an unreleased version, and a new version should be packaged.`);
    sh.exit(0);
  }

  info(`Registering ${newVersion} with sentry...`);
  sentryCli(`new "${newVersion}"`);

  info('Uploading source maps to sentry...');
  const sourceMapPath = path.join('bundles', 'renderer.js.map');
  sentryCli(`files "${newVersion}" upload-sourcemaps "${sourceMapPath}"`);

  info('Discovering publichsing artifacts...');

  const distDir = path.resolve('.', 'dist');
  const channelFileName = `${channel}.yml`;
  const channelFilePath = path.join(distDir, channelFileName);

  if (!fs.existsSync(channelFilePath)) {
    error(`Could not find ${path.resolve(channelFilePath)}`);
    sh.exit(1);
  }

  info(`Discovered ${channelFileName}`);

  const parsedLatest = yml.safeLoad(fs.readFileSync(channelFilePath));
  const installerFileName = parsedLatest.path;
  const installerFilePath = path.join(distDir, installerFileName);

  if (!fs.existsSync(installerFilePath)) {
    error(`Could not find ${path.resolve(installerFilePath)}`);
    sh.exit(1);
  }

  info(`Disovered ${installerFileName}`);

  info('Uploading publishing artifacts...');
  await uploadS3File(installerFileName, installerFilePath);
  await uploadS3File(channelFileName, channelFilePath);

  info('Finalizing release with sentry...');
  sentryCli(`finalize "${newVersion}`);

  if (deployType === 'normal') {
    info('Merging master back into staging...');
    executeCmd('git checkout staging');
    executeCmd('git merge master');
    executeCmd('git push origin HEAD');
  }

  info('Release process completed successfully!');
}

runScript().then(() => {
  sh.exit(0);
});
