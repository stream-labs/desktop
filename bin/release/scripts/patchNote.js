// @ts-check

const fs = require('fs');
const moment = require('moment');
const {
  info,
  error,
  executeCmd,
} = require('./prompt');
const { getTagCommitId } = require('./util');

// previous tag should be following rule:
//  v{major}.{minor}.{yyyymmdd}-[{channel}.]{ord}[internalMark]
const VERSION_REGEXP = /v(?<major>\d+)\.(?<minor>\d+)\.(?<date>\d{8})-((?<channel>\w+)\.)?(?<ord>\d+)(?<internalMark>d)?/;

function parseVersionTag(tag) {
  const result = VERSION_REGEXP.exec(tag);
  if (result && result.groups) return result.groups;
  throw new Error(`cannot parse a given tag: ${tag}`)
}

function validateVersionContext({
  versionTag,
  releaseEnvironment,
  releaseChannel,
}) {
  const result = VERSION_REGEXP.exec(versionTag);
  const { internalMark, channel } = result.groups;

  const versionEnvironment = internalMark ? 'internal' : 'public';
  const versionChannel = channel || 'stable';

  if (channel === 'stable') {
    throw new Error('stable channel has no prefix');
  }

  if (
    releaseChannel !== versionChannel
    || releaseEnvironment !== versionEnvironment
  ) {
    throw new Error('invalid version context');
  }
}

function generateNewVersion({
  previousTag,
  now = Date.now(),
}) {
  const {
    major, minor, date, channel, ord, internalMark
  } = parseVersionTag(previousTag);

  const today = moment(now).format('YYYYMMDD');
  const newOrd = date === today ? parseInt(ord, 10) + 1 : 1;
  const channelPrefix = channel ? `${channel}.` : '';
  return `${major}.${minor}.${today}-${channelPrefix}${newOrd}${internalMark || ''}`;
}

function splitToLines(lines) {
  if (typeof lines === 'string') {
    return lines.split(/\r?\n/g);
  }
  return lines;
}

function readPatchNoteFile(patchNoteFileName) {
  try {
    const lines = splitToLines(fs.readFileSync(patchNoteFileName, { encoding: 'utf8' }));
    const version = lines.shift();
    return {
      version,
      lines,
    };
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
    return null;
  }
}

function writePatchNoteFile(patchNoteFileName, version, contents) {
  const lines = splitToLines(contents);
  const body = [version, ...lines].join('\n');
  fs.writeFileSync(patchNoteFileName, body);
}

async function collectPullRequestMerges({ octokit, owner, repo }, previousTag) {
  const merges = executeCmd(`git log --oneline --merges ${previousTag}..`, { silent: true }).stdout;

  const promises = [];
  for (const line of merges.split(/\r?\n/)) {
    const pr = line.match(/.*Merge pull request #([0-9]*).*/);
    if (!pr || pr.length < 2) {
      continue;
    }
    const pullNumber = parseInt(pr[1], 10);
    promises.push(
      octokit.pullRequests.get({ owner, repo, pull_number: pullNumber }).catch(e => {
        info(e);
        return { data: {} };
      })
    );
  }

  function level(line) {
    if (line.startsWith('追加:')) {
      return 0;
    }
    if (line.startsWith('変更:')) {
      return 1;
    }
    if (line.startsWith('修正:')) {
      return 2;
    }
    return 3;
  }

  return Promise.all(promises).then(results => {
    const summary = [];
    for (const result of results) {
      const { data } = result;
      if ('title' in data) {
        summary.push(`${data.title} (#${data.number}) by ${data.user.login}\n`);
      }
    }

    summary.sort((a, b) => {
      const d = level(a) - level(b);
      if (d) {
        return d;
      }
      if (a < b) {
        return -1;
      }
      if (a === b) {
        return 0;
      }
      return 1;
    });

    return summary.join('');
  });
}

function generateNotesTsContent(version, title, notes) {
  const patchNote = `import { IPatchNotes } from '.';

export const notes: IPatchNotes = {
  version: '${version}',
  title: '${title}',
  notes: [
${notes
    .trim()
    .split('\n')
    .map(s => `    '${s}'`)
    .join(',\n')}
  ]
};
`;
  info(`patch-note: '${patchNote}'`);
  return patchNote;
}

function updateNotesTs({
  title,
  version,
  notes,
  filePath
}) {
  const generatedPatchNote = generateNotesTsContent(title, version, notes);

  fs.writeFileSync(filePath, generatedPatchNote);
}

/**
 * @param {object} param0
 * @param {string} param0.patchNoteFileName
 * @returns {{version: string, notes: string}}
 */
function readPatchNote({
  patchNoteFileName,
}) {
  info(`checking ${patchNoteFileName} ...`);
  const patchNote = readPatchNoteFile(patchNoteFileName);

  if (!patchNote) {
    error(`${patchNoteFileName} is absent. Generate it before release.`);
    throw new Error(`${patchNoteFileName} is absent.`);
  }

  if (getTagCommitId(`v${patchNote.version}`)) {
    error(`tag 'v${patchNote.version}' has already been released.`);
    throw new Error(`tag 'v${patchNote.version}' has already been released.`);
  }

  return {
    version: patchNote.version,
    notes: patchNote.lines.join('\n'),
  };
}

module.exports = {
  parseVersionTag,
  generateNewVersion,
  validateVersionContext,
  readPatchNoteFile,
  writePatchNoteFile,
  collectPullRequestMerges,
  updateNotesTs,
  readPatchNote,
};
