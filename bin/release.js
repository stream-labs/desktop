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
const cp = require('child_process');
const { purgeUrls } = require('./cache-purge');

/**
 * CONFIGURATION
 */
const s3Buckets = [ 'streamlabs-obs', 'slobs-cdn.streamlabs.com' ];
const sentryOrg = 'streamlabs-obs';
const sentryProject = 'streamlabs-obs';


function info(msg) {
  sh.echo(colors.magenta(msg));
}

function error(msg) {
  sh.echo(colors.red(`ERROR: ${msg}`));
}

function executeCmd(cmd, exit = true) {
  const result = sh.exec(cmd);

  if (result.code !== 0) {
    error(`Command Failed >>> ${cmd}`);
    if (exit) {
      sh.exit(1);
    } else {
      throw new Error(`Failed to execute command: ${cmd}`);
    }
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

async function callSubmodule(moduleName, args) {
  if (!Array.isArray(args)) args = [];

  return new Promise((resolve, reject) => {
    const submodule = cp.fork(moduleName, args);

    submodule.on('close', (code) => {
      if (code !== 0) {
        reject(code);
      } else {
        resolve();
      }
    });
  });
}

/* We can change the release script to export a function instead.
 * I already made this into a separate script so I think this is fine */
async function actualUploadUpdateFiles(bucket, version, appDir) {
  return callSubmodule(
    'bin/release-uploader.js',
    [
      '--s3-bucket', bucket,
      '--access-key', process.env['AWS_ACCESS_KEY_ID'],
      '--secret-access-key', process.env['AWS_SECRET_ACCESS_KEY'],
      '--version', version,
      '--release-dir', appDir,
    ]
  );
}

async function actualSetLatestVersion(bucket, version, fileName) {
  return callSubmodule(
    'bin/set-latest.js',
    [
      '--s3-bucket', bucket,
      '--access-key', process.env['AWS_ACCESS_KEY_ID'],
      '--secret-access-key', process.env['AWS_SECRET_ACCESS_KEY'],
      '--version', version,
      '--version-file', fileName
    ]
  );
}

async function actualSetChance(bucket, version, chance) {
  return callSubmodule(
    'bin/set-chance.js',
    [
      '--s3-bucket', bucket,
      '--access-key', process.env['AWS_ACCESS_KEY_ID'],
      '--secret-access-key', process.env['AWS_SECRET_ACCESS_KEY'],
      '--version', version,
      '--chance', chance
    ]
  );
}

async function actualUploadS3File(bucket, name, filepath) {
  info(`Starting upload of ${name}...`);

  const stream = fs.createReadStream(filepath);
  const upload = new AWS.S3.ManagedUpload({
    params: {
      Bucket: bucket,
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

/* Wrapper functions to upload to multiple s3 buckets */

async function uploadUpdateFiles(version, appDir) {
  for (const bucket of s3Buckets) {
    await actualUploadUpdateFiles(bucket, version, appDir);
  }
}

async function setLatestVersion(version, fileName) {
  for (const bucket of s3Buckets) {
    await actualSetLatestVersion(bucket, version, fileName);
  }
}

async function setChance(version, chance) {
  for (const bucket of s3Buckets) {
    await actualSetChance(bucket, version, chance);
  }
}

async function uploadS3File(name, filePath) {
  for (const bucket of s3Buckets) {
    await actualUploadS3File(bucket, name, filePath);
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
  checkEnv('SENTRY_AUTH_TOKEN');

  const isPreview = (await inq.prompt({
    type: 'list',
    name: 'releaseType',
    message: 'Which type of release would you like to do?',
    choices: [
      {
        name: 'Normal release (All users will receive this release)',
        value: 'normal'
      },
      {
        name: 'Preview release',
        value: 'preview'
      }
    ]
  })).releaseType === 'preview';

  let sourceBranch;
  let targetBranch;

  if (isPreview) {
    sourceBranch = (await inq.prompt({
      type: 'list',
      name: 'branch',
      message: 'Which branch would you like to release from?',
      choices: [
        {
          name: 'staging',
          value: 'staging'
        },
        {
          name: 'preview (during code freeze)',
          value: 'preview'
        }
      ]
    })).branch;
    targetBranch = 'preview';
  } else {
    sourceBranch = (await inq.prompt({
      type: 'list',
      name: 'branch',
      message: 'Which branch would you like to release from?',
      choices: [
        {
          name: 'preview',
          value: 'preview'
        },
        {
          name: 'staging',
          value: 'staging'
        },
        {
          name: 'master (hotfix releases only)',
          value: 'master'
        }
      ]
    })).branch;
    targetBranch = 'master';
  }

  // Make sure the release environment is clean
  info('Stashing all uncommitted changes...');
  executeCmd('git add -A');
  executeCmd('git stash');

  // Sync the source branch
  info(`Syncing ${sourceBranch} with the origin...`);
  executeCmd('git fetch');
  executeCmd(`git checkout ${sourceBranch}`);
  executeCmd('git pull');
  executeCmd(`git reset --hard origin/${sourceBranch}`);

  if (sourceBranch !== targetBranch) {
    // Sync the target branch
    info(`Syncing ${targetBranch} with the origin...`);
    executeCmd('git fetch');
    executeCmd(`git checkout ${targetBranch}`);
    executeCmd('git pull');
    executeCmd(`git reset --hard origin/${targetBranch}`);

    // Merge the source branch into the target branch
    info(`Merging ${sourceBranch} into ${targetBranch}...`);
    executeCmd(`git merge ${sourceBranch}`);
  }

  info('Removing old packages...');
  sh.rm('-rf', 'node_modules');

  info('Installing fresh packages...');
  executeCmd('yarn install');

  info('Signing binaries...');
  executeCmd('yarn signbinaries');

  info('Compiling assets...');
  executeCmd('yarn compile:production');

  const pjson = JSON.parse(fs.readFileSync('package.json'));
  const currentVersion = pjson.version;

  info(`The current application version is ${currentVersion}`);

  let versionOptions;

  if (isPreview) {
    versionOptions = [
      semver.inc(currentVersion, 'prerelease', 'preview'),
      semver.inc(currentVersion, 'prepatch', 'preview'),
      semver.inc(currentVersion, 'preminor', 'preview'),
      semver.inc(currentVersion, 'premajor', 'preview')
    ];
  } else {
    versionOptions = [
      semver.inc(currentVersion, 'patch'),
      semver.inc(currentVersion, 'minor'),
      semver.inc(currentVersion, 'major')
    ];
  }

  // Remove duplicates
  versionOptions = [...new Set(versionOptions)];

  const newVersion = (await inq.prompt({
    type: 'list',
    name: 'newVersion',
    message: 'What should the new version number be?',
    choices: versionOptions
  })).newVersion;

  const channel = (() => {
    const components = semver.prerelease(newVersion);

    if (components) return components[0];
    return 'latest';
  })();

  if (!await confirm(`Are you sure you want to package version ${newVersion}?`)) sh.exit(0);

  pjson.version = newVersion;

  info(`Writing ${newVersion} to package.json...`);
  fs.writeFileSync('package.json', JSON.stringify(pjson, null, 2));

  info('Packaging the app...');
  executeCmd(`yarn package${isPreview ? ':preview' : ''}`);

  info(`Version ${newVersion} is ready to be deployed.`);
  info('You can find the packaged app at dist/win-unpacked.');
  info('Please run the packaged application now to ensure it starts up properly.');
  info('When you have confirmed the packaged app works properly, you');
  info('can continue with the deploy.');

  if (!await confirm('Are you ready to deploy?')) sh.exit(0);

  const chance = (await inq.prompt({
    type: 'input',
    name: 'chance',
    message: 'What percentage of the userbase would you like to recieve the update?'
  })).chance;

  info('Committing changes...');
  executeCmd('git add -A');
  executeCmd(`git commit -m "Release version ${newVersion}"`);

  info('Pushing changes...');
  executeCmd('git push origin HEAD');

  info(`Tagging version ${newVersion}...`);
  executeCmd(`git tag -f v${newVersion}`);
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
  const channelFileName = path.parse(sh.ls(path.join(distDir, '*.yml'))[0]).base;
  const channelFilePath = path.join(distDir, channelFileName);

  info(`Discovered ${channelFileName}`);

  const parsedChannel = yml.safeLoad(fs.readFileSync(channelFilePath));
  const installerFileName = parsedChannel.path;
  const installerFilePath = path.join(distDir, installerFileName);

  if (!fs.existsSync(installerFilePath)) {
    error(`Could not find ${path.resolve(installerFilePath)}`);
    sh.exit(1);
  }

  info(`Disovered ${installerFileName}`);
  info('Uploading publishing artifacts...');

    /* Use the separate release-uploader script to upload our
   * win-unpacked content. */

  await uploadUpdateFiles(newVersion, path.resolve('dist', 'win-unpacked'));
  await uploadS3File(installerFileName, installerFilePath);
  await uploadS3File(channelFileName, channelFilePath);

  info('Setting chance...');
  await setChance(newVersion, chance);

  info('Setting latest version...');
  await setLatestVersion(newVersion, channel);

  info('Purging Cloudflare cache...');
  await purgeUrls([
    `https://slobs-cdn.streamlabs.com/${channel}.json`,
    `https://slobs-cdn.streamlabs.com/${channel}.yml`
  ]);

  info('Finalizing release with sentry...');
  sentryCli(`finalize "${newVersion}`);

  info(`Merging ${targetBranch} back into staging...`);
  try {
    executeCmd(`git checkout staging`, false);
    executeCmd(`git merge ${targetBranch}`, false);
    executeCmd('git push origin HEAD', false);
  } catch (e) {
    error(e);
    error(
      `The release was successfully pushed, but ${targetBranch} was not successfully ` +
      'merged back into staging.  Please renconcile these branches manually.'
    )
  }

  info(`Version ${newVersion} released successfully!`);
}

runScript().then(() => {
  sh.exit(0);
});
