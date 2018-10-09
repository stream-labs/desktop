const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const util = require('util');
const pmap = require('p-map');

const readdir = util.promisify(fs.readdir);
const lstat = util.promisify(fs.lstat);

function addHashEntry(digest, filePath, context) {
  const fileEntry = path.relative(context.rootFolderPath, filePath);
  context.callback(fileEntry, digest);
}

async function handleFileLstat(stats, filePath, context) {
  if (stats.isSymbolicLink()) {
    console.log(`Ignoring symbolic link: ${filePath}`);
    return;
  }

  if (stats.isDirectory()) {
    const files = await readdir(filePath);
    await handleFolderRead(files, filePath, context);
    return;
  }

  /* Hash the file for later comparison. This is the value of the key. */
  const digest = await new Promise((resolve, reject) => {
    const fileStream = fs.createReadStream(filePath);
    const hash = crypto.createHash(context.hashAlgo);

    fileStream.on('data', (chunk) => { hash.update(chunk); });

    fileStream.on('close', () => { resolve(hash.digest('hex')); });

    fileStream.on('error', reject);
  });

  addHashEntry(digest, filePath, context);
}

async function handleFolderRead(files, folderPath, context) {
  return pmap(files, (file) => {
    const filePath = path.resolve(folderPath, file);

    return lstat(filePath).then(
        (stats) => { return handleFileLstat(stats, filePath, context); });
  }, {concurrency: 10});
}

/**
    Our primary entry point and what gets executed
    if we run from command line.

    @param folderPath
        A full or relative path to the file
        If it's a full path, the file list will
        still contain a relative path since its
        required when updating.

    @param hashAlgo
        The hash algorithm to use when creating a
        hash for the file. This is to be one of the
        elements returned from crypto.getHashes().
        It may return a hash that doesn't work
        out of the box. My answer to that is use
        one that's supported. I may add a whilelist
        at a later time.

    @todo A callback when a path/hash key/value is made should
          be used instead to allow formats outside of json.
          It would also be the easiest way to prevent having
          to load the entirety of the file list into a single
          object which can be heavy in some use-cases.
 */
async function generateFileList(folderPath, hashAlgo, callback) {
  /* Our list is a dictionary where the key
   * is the relative path to the file from
   * the root directory. This is important
   * since it's used during updating as well
   * since full path will obviously differ per
   * machine. */
  const cwd = path.resolve();
  const rootFolderPath = path.resolve(cwd, folderPath);
  const context = { callback, rootFolderPath, hashAlgo };
  const files = await readdir(rootFolderPath);

  await handleFolderRead(files, rootFolderPath, context);
}

module.exports = generateFileList;
