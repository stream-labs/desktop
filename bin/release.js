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

let promptToContinue = false;

/**
 * CONFIGURATION
 */
const channel = 'latest';
const s3Bucket = 'streamlabs-obs';
const sentryOrg = 'streamlabs-obs';
const sentryProject = 'streamlabs-obs';


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

    if (promptToContinue) {
      info('Because this release was succssfully packaged before the process failed, you');
      info('may safely choose the option "Continue a failed release" when re-running');
      info('this script.  This will skip packaging and will not use up another version number.');
    }

    sh.exit(1);
  }
}

function sentryCli(cmd) {
  const sentryPath = path.join('bin', 'node_modules', 'sentry-cli-binary', 'bin', 'sentry-cli');

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
  info(colors.magenta('|-------------------------------------------|'));
  info(colors.magenta('| Streamlabs OBS Interactive Release Script |'));
  info(colors.magenta('|-------------------------------------------|'));

  if (!await confirm('Are you sure you want to release?')) sh.exit(0);

  // Start by figuring out if this environment is configured properly
  // for releasing.
  checkEnv('AWS_ACCESS_KEY_ID');
  checkEnv('AWS_SECRET_ACCESS_KEY');
  checkEnv('CSC_LINK');
  checkEnv('CSC_KEY_PASSWORD');
  checkEnv('SENTRY_AUTH_TOKEN');

  const deployType = (await inq.prompt({
    type: 'list',
    name: 'deployType',
    message: 'How would you like to release?',
    choices: [
      {
        name: 'Merge staging into master and release from master (normal release)',
        value: 'normal'
      },
      {
        name: 'Release the current branch as-is (high priority hotfix releases only)',
        value: 'as-is'
      },
      {
        name: 'Continue a failed release (skips all packaging and testing)',
        value: 'continue'
      }
    ]
  })).deployType;

  if (deployType === 'normal') {
    // Make sure the release environment is clean
    info('Stashing all uncommitted changes...');
    executeCmd('git add -A');
    executeCmd('git stash');

    info('Syncing staging with the origin...');
    executeCmd('git checkout staging');
    executeCmd('git pull');
    executeCmd('git reset --hard origin/staging');

    info('Syncing master with the origin...');
    executeCmd('git checkout master');
    executeCmd('git pull');
    executeCmd('git reset --hard origin/master');

    info('Merging staging into master...');
    executeCmd('git merge staging');
  } else if (deployType === 'as-is') {
    warn('You are about to release the current branch as-is.');
    warn('You should only do this if you know what you are doing.');
    warn('The current branch you are about to release should almost definitely be master');
    if (!await confirm('Are you absolutely sure you want to release the current branch?')) sh.exit(0);
  } else if (deployType === 'continue') {
    warn('You are about to deploy the packaged app as-is in your dist/ directory.');
    warn('You should only run this if a release just failed during one of the following steps:');
    warn('- Pushing changes to the origin git repository');
    warn('- Registering the release and source code with sentry');
    warn('- Uploading the release artifacts to S3');
    if (!await confirm('Are you absolutely sure you want to continue with the release?')) sh.exit(0);
  }

  let newVersion;

  if (deployType === 'continue') {
    const pjson = JSON.parse(fs.readFileSync('package.json'));
    newVersion = pjson.version;
  } else {
    info('Ensuring submodules are up to date...');
    executeCmd('git submodule update --init --recursive');

    info('Removing old packages...');
    sh.rm('-rf', 'node_modules');

    info('Installing fresh packages...');
    executeCmd('yarn install');

    info('Installing OBS plugins...');
    executeCmd('yarn install-plugins');

    info('Compiling assets...');
    executeCmd('yarn compile');

    info('Running tests...');
    executeCmd('yarn test');

    info('The current revision has passed testing and is ready to be');
    info('packaged and released');

    const pjson = JSON.parse(fs.readFileSync('package.json'));
    const currentVersion = pjson.version;

    info(`The current application version is ${currentVersion}`);
    newVersion = (await inq.prompt({
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

    info(`Writing ${newVersion} to package.json...`);
    fs.writeFileSync('package.json', JSON.stringify(pjson, null, 2));

    // Packaging the app takes a long time and sometimes fails, so we
    // do this step before committing and tagging the release.  This way
    // we can re-run the script without "wasting" a version number.
    info('Packaging the app...');
    executeCmd('yarn package');

    info(`Version ${newVersion} is ready to be deployed.`);
    info('You can find the packaged app at dist/win-unpacked.');
    info('Please run the packaged application now to ensure it starts up properly.');
    info('When you have confirmed the packaged app works properly, you');
    info('can continue with the deploy.');

    if (!await confirm('Are you ready to deploy?')) sh.exit(0);
  }

  // This prints a special error message on exits that lets the user know
  // they can optionally choose to perform a "continue" release, which will
  // skip re-packaging the app and will not increase the version number again.
  promptToContinue = true;

  info('Committing changes...');
  executeCmd('git add -A');
  executeCmd(`git commit -m "Release version ${newVersion}"`);

  info('Pushing changes...');
  executeCmd('git push origin HEAD');

  info(`Tagging version ${newVersion}...`);
  executeCmd(`git tag -f 'v${newVersion}'`);
  executeCmd('git push --tags');

  info(`Registering ${newVersion} with sentry...`);
  sentryCli(`new "${newVersion}"`);
  sentryCli(`set-commits --auto "${newVersion}"`);

  info('Uploading compiled source to sentry...');
  const sourcePath = path.join('bundles', 'renderer.js');
  const sourceMapPath = path.join('bundles', 'renderer.js.map');
  sentryCli(`files "${newVersion}" delete --all`);
  sentryCli(`files "${newVersion}" upload "${sourcePath}"`);
  sentryCli(`files "${newVersion}" upload "${sourceMapPath}"`);

  info('Discovering publishing artifacts...');

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

  info(`Version ${newVersion} released successfully!`);
}

runScript().then(() => {
  sh.exit(0);
});
