// @ts-check
/*
 * All-in-one interactive N Air release script.
 */

const fs = require('fs');
const path = require('path');
const OctoKit = require('@octokit/rest');
const inq = require('inquirer');
const sh = require('shelljs');
const colors = require('colors/safe');
const yaml = require('js-yaml');
const {
  log,
  info,
  error,
  executeCmd,
  confirm,
} = require('./scripts/prompt');
const {
  checkEnv,
  getTagCommitId,
} = require('./scripts/util');
const {
  updateNotesTs,
  readPatchNote,
} = require('./scripts/patchNote');
const {
  uploadS3File,
  uploadToGithub,
  uploadToSentry
} = require('./scripts/uploadArtifacts');

function packagingRoutine({
  skipBuild,
  skipCleaningNodeModules,
  releaseEnvironment,
  releaseChannel,
}) {
  if (skipBuild) {
    info('SKIP build process since skipBuild is set...');
  } else {
    if (skipCleaningNodeModules) {
      // clean
      info('Removing old packages...');
      sh.rm('-rf', 'node_modules');
    }

    info('Installing yarn packages...');
    executeCmd('yarn install');

    info('Compiling assets...');
    executeCmd('yarn compile:production');

    info('Making the package...');
    const envPrefix = releaseEnvironment === 'public' ? '' : `${releaseEnvironment}-`;
    executeCmd(`yarn package:${envPrefix}${releaseChannel}`);
  }
}

function tapArtifactsRoutine({
  notes
}) {
  const distDir = path.resolve('.', 'dist');
  const latestYml = path.join(distDir, 'latest.yml');
  const parsedLatestYml = yaml.safeLoad(fs.readFileSync(latestYml, 'utf-8'));

  // add releaseNotes into latest.yml
  parsedLatestYml.releaseNotes = notes;
  fs.writeFileSync(latestYml, yaml.safeDump(parsedLatestYml));

  const binaryFile = parsedLatestYml.path;
  const binaryFilePath = path.join(distDir, binaryFile);
  if (!fs.existsSync(binaryFilePath)) {
    error(`Counld not find ${path.resolve(binaryFilePath)}`);
    sh.exit(1);
  }
  const blockmapFile = `${binaryFile}.blockmap`;
  const blockmapFilePath = path.join(distDir, blockmapFile);
  if (!fs.existsSync(blockmapFilePath)) {
    error(`Counld not find ${path.resolve(blockmapFilePath)}`);
    sh.exit(1);
  }

  executeCmd(`ls -l ${binaryFilePath} ${blockmapFilePath} ${latestYml}`);

  return {
    latestYml,
    binaryFilePath,
    blockmapFilePath
  };
}

async function uploadToS3Routine({
  latestYml,
  binaryFilePath,
  blockmapFilePath,
  uploadS3BucketName,
  releaseChannel,
}) {
  // upload to releases s3 bucket via aws-sdk...
  // s3へのアップロードは外部へ即座に公開されるため、latestYmlのアップロードは最後である必要がある
  // そうでない場合、アップロード中で存在していないファイルをlatestYmlが指す時間が発生し、
  // electron-updaterがエラーとなってしまう可能性がある

  info('uploading artifacts to s3...');
  await uploadS3File({
    name: path.basename(binaryFilePath),
    bucketName: uploadS3BucketName,
    filePath: binaryFilePath,
    isUnstable: releaseChannel !== 'stable',
  });
  await uploadS3File({
    name: path.basename(blockmapFilePath),
    bucketName: uploadS3BucketName,
    filePath: blockmapFilePath,
    isUnstable: releaseChannel !== 'stable',
  });
  await uploadS3File({
    name: path.basename(latestYml),
    bucketName: uploadS3BucketName,
    filePath: latestYml,
    isUnstable: releaseChannel !== 'stable',
  });
}

async function releaseToGitHubRoutine({
  targetHost,
  targetOrganization,
  targetRepository,
  uploadGitHubToken,
  newTag,
  notes,
  releaseChannel,
  enableUploadToGitHub,
  latestYml,
  blockmapFilePath,
  binaryFilePath
}) {
  // upload to the github directly via GitHub API...

  const octokit = new OctoKit({
    baseUrl: targetHost,
    auth: `token ${uploadGitHubToken}`,
  });

  info(`creating release ${newTag}...`);
  const result = await octokit.repos.createRelease({
    owner: targetOrganization,
    repo: targetRepository,
    tag_name: newTag,
    name: newTag,
    body: notes,
    draft: true,
    prerelease: releaseChannel !== 'stable',
  });

  if (enableUploadToGitHub) {
    await uploadToGithub({
      octokit,
      url: result.data.upload_url,
      pathname: latestYml,
      contentType: 'application/json',
    });

    await uploadToGithub({
      octokit,
      url: result.data.upload_url,
      pathname: blockmapFilePath,
      contentType: 'application/octet-stream',
    });

    await uploadToGithub({
      octokit,
      url: result.data.upload_url,
      pathname: binaryFilePath,
      contentType: 'application/octet-stream',
    });
  } else {
    info('uploading to GitHub: SKIP');
  }

  return result;
}

/**
 * This is the main function of the script
 * @param {object} param0
 * @param {'public' | 'internal'} param0.releaseEnvironment
 * @param {'stable' | 'unstable'} param0.releaseChannel
 * @param {object} param0.target
 * @param {string} param0.target.host
 * @param {string} param0.target.organization
 * @param {string} param0.target.repository
 * @param {string} param0.target.remote
 * @param {string} param0.target.branch
 * @param {object} param0.sentry
 * @param {string} param0.sentry.organization
 * @param {string} param0.sentry.project
 * @param {object} param0.upload
 * @param {string} param0.upload.githubToken
 * @param {string} param0.upload.s3BucketName
 * @param {object} param0.patchNote
 * @param {string} param0.patchNote.version
 * @param {string} param0.patchNote.notes
 * @param {boolean} param0.generateNoteTs
 * @param {boolean} param0.skipLocalModificationCheck
 * @param {boolean} param0.skipBuild
 * @param {boolean} param0.enableUploadToS3
 * @param {boolean} param0.enableUploadToGitHub
 * @param {boolean} param0.enableUploadToSentry
 */
async function runScript({
  releaseEnvironment,
  releaseChannel,
  target,
  sentry,
  upload,
  patchNote,

  generateNoteTs, // generate note.ts from git logs

  skipLocalModificationCheck, // for DEBUG
  skipBuild, // for DEBUG

  enableUploadToS3,
  enableUploadToGitHub,
  enableUploadToSentry,
}) {
  const newVersion = patchNote.version;
  const newTag = `v${newVersion}`;

  info('Release summary:');
  log('releaseEnvironment: ', releaseEnvironment === 'public' ? colors.red(releaseEnvironment) : releaseEnvironment);
  log('releaseChannel: ', releaseChannel === 'stable' ? colors.red(releaseChannel) : releaseChannel);
  log('---- ---- ---- ----');
  log('version:', colors.cyan(patchNote.version));
  log('notes:', colors.cyan(patchNote.notes));
  log('---- ---- ---- ----');
  log('target:');
  log('         host:', colors.cyan(target.host));
  log(' organization:', colors.cyan(target.organization));
  log('   repository:', colors.cyan(target.repository));
  log('       remote:', colors.cyan(target.remote));
  log('       branch:', colors.cyan(target.branch));
  log('sentry:');
  log(' organization:', colors.cyan(sentry.organization));
  log('      project:', colors.cyan(sentry.project));
  log('upload:');
  log('   githubHost:', colors.cyan(target.host));
  log('  githubToken:', colors.cyan(upload.githubToken));
  log(' s3BucketName:', colors.cyan(upload.s3BucketName));
  log('---- ---- ---- ----\n\n');

  if (!await confirm('Are you sure to release with these configs?', false)) {
    sh.exit(0);
  }

  info(`check whether remote ${target.remote} exists`);
  executeCmd(`git remote get-url ${target.remote}`);

  if (skipLocalModificationCheck) {
    info('make sure there is nothing to commit on local directory');

    executeCmd('git status'); // there should be nothing to commit
    executeCmd('git diff -s --exit-code'); // and nothing changed
  }

  info('checking current branch...');
  const currentBranch = executeCmd('git rev-parse --abbrev-ref HEAD').stdout.trim();
  if (currentBranch !== target.branch) {
    if (!(await confirm(`current branch '${currentBranch}' is not '${target.branch}'. continue?`, false))) {
      sh.exit(1);
    }
  }

  info('pulling fresh repogitory...');
  executeCmd('git pull');

  const baseDir = executeCmd('git rev-parse --show-cdup', { silent: true }).stdout.trim();
  const noteFilename = `${baseDir}app/services/patch-notes/notes.ts`;

  if (!generateNoteTs) {
    info('skipping to generate notes.ts...');
  } else {
    updateNotesTs({
      filePath: noteFilename,
      title: newVersion,
      ...patchNote,
    });
    info(`generated patch-note file: ${noteFilename}.`);
  }

  // update package.json with newVersion and git tag
  executeCmd(`yarn version --new-version=${newVersion}`);

  const skipCleaningNodeModules = !skipBuild && !(await confirm('skip cleaning node_modules?'));
  packagingRoutine({
    skipBuild,
    skipCleaningNodeModules,
    releaseEnvironment,
    releaseChannel,
  });

  info('Pushing to the repository...');
  executeCmd(`git push ${target.remote} ${target.branch}`);
  executeCmd(`git push ${target.remote} ${newTag}`);

  info(`version: ${newVersion}`);

  const {
    latestYml,
    binaryFilePath,
    blockmapFilePath,
  } = tapArtifactsRoutine({ notes: patchNote.notes });

  if (enableUploadToS3) {
    await uploadToS3Routine({
      latestYml,
      binaryFilePath,
      blockmapFilePath,
      uploadS3BucketName: upload.s3BucketName,
      releaseChannel,
    });
  } else {
    info('uploading artifacts to s3: SKIP');
  }

  const result = await releaseToGitHubRoutine({
    targetHost: target.host,
    targetOrganization: target.organization,
    targetRepository: target.repository,
    uploadGitHubToken: upload.githubToken,
    newTag,
    notes: patchNote.notes,
    releaseChannel,
    enableUploadToGitHub,
    latestYml,
    blockmapFilePath,
    binaryFilePath
  });


  // open release edit page on github
  const editUrl = result.data.html_url.replace('/tag/', '/edit/');
  executeCmd(`start ${editUrl}`);

  info(`finally, release Version ${newVersion} on the browser!`);


  if (enableUploadToSentry) {
    info('uploading to sentry...');
    uploadToSentry(sentry.organization, sentry.project, newVersion, path.resolve('.', 'bundles'));
  } else {
    info('uploading to sentry: SKIP');
  }

  // done.
}

async function releaseRoutine() {
  info(colors.magenta('|----------------------------------|'));
  info(colors.magenta('| N Air Interactive Release Script |'));
  info(colors.magenta('|----------------------------------|'));

  checkEnv('CSC_LINK');
  checkEnv('CSC_KEY_PASSWORD');
  checkEnv('NAIR_LICENSE_API_KEY');
  checkEnv('SENTRY_AUTH_TOKEN');
  checkEnv('AWS_ACCESS_KEY_ID');
  checkEnv('AWS_SECRET_ACCESS_KEY');

  const { releaseEnvironment } = await inq.prompt({
    type: 'list',
    name: 'releaseEnvironment',
    message: 'What environment do you want to release?',
    choices: ['internal', 'public'],
  });

  const config = releaseEnvironment === 'public' ? require('./public.config') : require('./internal.config');

  const { releaseChannel } = await inq.prompt({
    type: 'list',
    name: 'releaseChannel',
    message: 'What channel do you want to release?',
    choices: ['unstable', 'stable'],
  });

  const baseDir = executeCmd('git rev-parse --show-cdup', { silent: true }).stdout.trim();
  const patchNoteFileName = `${baseDir}patch-note.txt`;

  const patchNote = readPatchNote({ patchNoteFileName });

  if (!patchNote) {
    error(`patchNote is not found in ${patchNoteFileName}.`);
    info('Use `yarn patch-note` to generate patchNote.');
    throw new Error(`patchNote is not found in ${patchNoteFileName}.`);
  }

  if (getTagCommitId(`v${patchNote.version}`)) {
    error(`Tag "v${patchNote.version}" has already been released.`);
    info('Generate new patchNote with new version.');
    info('If you want to retry current release, remove the tag and related release commit.');
    throw new Error(`Tag "v${patchNote.version}" has already been released.`);
  }

  // TODO: versionの値がpublicReleaseとreleaseChannelの条件を満たしているか確認する


  await runScript({
    patchNote,
    releaseEnvironment,
    releaseChannel,
    ...config,
    generateNoteTs: true,
    skipLocalModificationCheck: false,
    skipBuild: false,
    enableUploadToS3: true,
    enableUploadToGitHub: true,
    enableUploadToSentry: true,
  });
}

if (!module.parent) {
  releaseRoutine();
}
