// @ts-check

const OctoKit = require('@octokit/rest');
const sh = require('shelljs');
const inq = require('inquirer');
const colors = require('colors/safe');
const {
  log,
  info,
  error,
  input,
  confirm,
  executeCmd,
} = require('./scripts/prompt');
const {
  checkEnv,
  getTagCommitId,
} = require('./scripts/util');
const {
  validateVersionContext,
  generateNewVersion,
  readPatchNoteFile,
  writePatchNoteFile,
  collectPullRequestMerges,
} = require('./scripts/patchNote');

async function generatePatchNote({
  patchNoteFileName,
  releaseEnvironment,
  releaseChannel,
  githubTokenForReadPullRequest
}) {
  info('checking current tag ...');
  const previousTag = executeCmd('git describe --tags --abbrev=0').stdout.trim();
  info(`current tag: ${previousTag}`);

  info(`checking ${patchNoteFileName} ...`);
  const previousPatchNote = readPatchNoteFile(patchNoteFileName);
  if (previousPatchNote) {
    info('patch-note.txt found');
    log(`${previousPatchNote.version}\n${previousPatchNote.lines.join('\n')}`);

    if (!await confirm('overwrite?', false)) {
      sh.exit(1);
    }
  }

  validateVersionContext({
    versionTag: previousTag,
    releaseEnvironment,
    releaseChannel,
  });
  const defaultVersion = generateNewVersion({
    previousTag,
  });
  const newVersion = await input('What should the new version number be?', defaultVersion);

  if (getTagCommitId(`v${newVersion}`)) {
    error(`version ${newVersion} has already been released`);
    sh.exit(1);
  }

  const prMerges = await collectPullRequestMerges(
    {
      octokit: new OctoKit({
        baseUrl: 'https://api.github.com',
        auth: `token ${githubTokenForReadPullRequest}`,
      }),
      owner: 'n-air-app',
      repo: 'n-air-app',
    },
    previousTag
  );

  const directCommits = executeCmd(`git log --no-merges --first-parent --pretty=format:"%s (%t)" ${previousTag}..`, {
    silent: true,
  }).stdout;
  const directCommitsNotes = directCommits ? `\nDirect Commits:\n${directCommits}` : '';
  const newNotes = `${prMerges}${directCommitsNotes}`;

  writePatchNoteFile(patchNoteFileName, newVersion, newNotes);
  info(`generated ${patchNoteFileName}:`);
  log(newNotes);

  info(`Please edit ${patchNoteFileName} if needed.`);
}

if (!module.parent) {
  (async () => {
    info(colors.magenta('|------------------------------|'));
    info(colors.magenta('| N Air Release Note Generator |'));
    info(colors.magenta('|------------------------------|'));

    checkEnv('NAIR_GITHUB_TOKEN');

    const baseDir = executeCmd('git rev-parse --show-cdup', { silent: true }).stdout.trim();
    const patchNoteFileName = `${baseDir}patch-note.txt`;

    const { releaseEnvironment } = await inq.prompt({
      type: 'list',
      name: 'releaseEnvironment',
      message: 'What environment do you want to release?',
      choices: ['internal', 'public'],
    });

    const { releaseChannel } = await inq.prompt({
      type: 'list',
      name: 'releaseChannel',
      message: 'What channel do you want to release?',
      choices: ['unstable', 'stable'],
    });

    await generatePatchNote({
      patchNoteFileName,
      releaseEnvironment,
      releaseChannel,
      githubTokenForReadPullRequest: process.env.NAIR_GITHUB_TOKEN,
    });
  })();
}
