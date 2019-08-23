// @ts-check

const fs = require('fs');
const moment = require('moment');
const {
  info,
  executeCmd,
} = require('./prompt');

function generateNewVersion(previousTag, internalRelease, now = Date.now()) {
  // previous tag should be following rule:
  //  v{major}.{minor}.{yyyymmdd}-{ord}

  const re = /v(\d+)\.(\d+)\.(\d{8})-(\d+)/g;
  let result = re.exec(previousTag);
  if (!result || result.length < 5) {
    result = ['', '0', '1', '', '1'];
  }
  const [, major, minor, date, ord] = result;

  const today = moment(now).format('YYYYMMDD');
  const newOrd = date === today ? ord + 1 : 1;
  return `${major}.${minor}.${today}-${newOrd}${internalRelease ? 'd' : ''}`;
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

module.exports = {
  generateNewVersion,
  readPatchNoteFile,
  writePatchNoteFile,
  collectPullRequestMerges,
  generateNotesTsContent,
};
