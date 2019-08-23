// @ts-check
/*
 * All-in-one interactive N Air release script.
 */

const fs = require('fs');
const path = require('path');
const OctoKit = require('@octokit/rest');
const {
  info,
  error,
  executeCmd,
  confirm,
  input,
} = require('./scripts/prompt');
const {
  checkEnv,
  getTagCommitId,
} = require('./scripts/util');
const {
  generateNewVersion,
  readPatchNoteFile,
  writePatchNoteFile,
  collectPullRequestMerges,
  updateNotesTs,
} = require('./scripts/patchNote');
const {
  uploadS3File,
  uploadToGithub,
  uploadToSentry
} = require('./scripts/uploadArtifacts');

let sh;
let colors;
let yaml;

try {
  sh = require('shelljs');
  colors = require('colors/safe');
  yaml = require('js-yaml');
} catch (e) {
  if (e.message.startsWith('Cannot find module')) {
    throw new Error(`先に\`yarn install\`を実行する必要があります: ${e.message}`);
  }
  throw e;
}

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
  const parsedLatestYml = yaml.safeLoad(fs.readFileSync(latestYml));

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
 * @param {boolean} [param0.generateNoteTs=true]
 * @param {boolean} [param0.skipLocalModificationCheck=true]
 * @param {boolean} [param0.skipBuild=false]
 * @param {boolean} [param0.enableUploadToS3=true]
 * @param {boolean} [param0.enableUploadToGitHub=true]
 * @param {boolean} [param0.enableUploadToSentry=true]
 * @param {string} param0.githubTokenForReadPullRequest
 */
async function runScript({
  releaseEnvironment,
  releaseChannel,
  target,
  sentry,
  upload,

  generateNoteTs = true, // generate note.ts from git logs

  skipLocalModificationCheck = false, // for DEBUG
  skipBuild = false, // for DEBUG

  enableUploadToS3 = true,
  enableUploadToGitHub = true,
  enableUploadToSentry = true,

  githubTokenForReadPullRequest,
}) {
  info(colors.magenta('|----------------------------------|'));
  info(colors.magenta('| N Air Interactive Release Script |'));
  info(colors.magenta('|----------------------------------|'));

  // Start by figuring out if this environment is configured properly
  // for releasing.
  checkEnv('CSC_LINK');
  checkEnv('CSC_KEY_PASSWORD');
  checkEnv('NAIR_LICENSE_API_KEY');
  checkEnv('SENTRY_AUTH_TOKEN');
  checkEnv('AWS_ACCESS_KEY_ID');
  checkEnv('AWS_SECRET_ACCESS_KEY');

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

  info('checking current tag...');
  const previousTag = executeCmd('git describe --tags --abbrev=0').stdout.trim();

  const baseDir = executeCmd('git rev-parse --show-cdup', { silent: true }).stdout.trim();

  let defaultVersion = generateNewVersion(previousTag, releaseEnvironment === 'internal');
  let notes = '';

  info('checking patch-note.txt...');
  const patchNoteFileName = `${baseDir}patch-note.txt`;
  const patchNote = readPatchNoteFile(patchNoteFileName);
  if (patchNote.version) {
    if (patchNote.version === defaultVersion || !getTagCommitId(patchNote.version)) {
      defaultVersion = patchNote.version;
      notes = patchNote.lines.join('\n');
      info(`${patchNoteFileName} loaded: ${defaultVersion}\n${notes}`);
    } else {
      info(`${patchNoteFileName} 's version ${patchNote.version} already exists.`);
    }
  } else {
    info(`${patchNoteFileName} not found.`);
  }

  const newVersion = await input('What should the new version number be?', defaultVersion);

  const newTag = `v${newVersion}`;
  if (getTagCommitId(newTag)) {
    error(`tag ${newTag} already exists!`);
    sh.exit(1);
  }

  if (!notes) {
    // get pull request description from github.com
    const github = new OctoKit({
      baseUrl: 'https://api.github.com',
      auth: `token ${githubTokenForReadPullRequest}`,
    });
    const prMerges = await collectPullRequestMerges(
      {
        octokit: github,
        owner: 'n-air-app',
        repo: 'n-air-app',
      },
      previousTag
    );
    notes = prMerges;

    const directCommits = executeCmd(`git log --no-merges --first-parent --pretty=format:"%s (%t)" ${previousTag}..`, {
      silent: true,
    }).stdout;
    if (directCommits) {
      notes = `${prMerges}\nDirect Commits:\n${directCommits}`;
    }

    info(notes);

    writePatchNoteFile(patchNoteFileName, newVersion, notes);
    info(`generated ${patchNoteFileName}.`);
    if (await confirm(`Do you want to edit ${patchNoteFileName}?`, true)) sh.exit(0);
  } else if (newVersion !== defaultVersion) {
    writePatchNoteFile(patchNoteFileName, newVersion, notes);
    info(`updated version ${newVersion} to  ${patchNoteFileName}.`);
  }

  if (!(await confirm(`Are you sure you want to release as version ${newVersion}?`, false))) sh.exit(0);
  const skipCleaningNodeModules = !skipBuild && !(await confirm('skip cleaning node_modules?'));

  const noteFilename = `${baseDir}app/services/patch-notes/notes.ts`;
  if (!generateNoteTs) {
    info('skipping to generate notes.ts...');
  } else {
    updateNotesTs({
      filePath: noteFilename,
      title: newVersion,
      version: newVersion,
      notes
    });
    info(`generated patch-note file: ${noteFilename}.`);
  }

  // update package.json with newVersion and git tag
  executeCmd(`yarn version --new-version=${newVersion}`);

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
  } = tapArtifactsRoutine({ notes });

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
    notes,
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

module.exports = runScript;
