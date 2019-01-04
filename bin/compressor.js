const zlib = require('zlib');
const path = require('path');
const fs = require('fs');
const util = require('util');
// TODO: we're getting these through dev deps, maybe we should be explicit about these
const pmap = require('p-map');
const pump = require('pump');

const mkdir = util.promisify(fs.mkdir);

async function mkdirMaybe(directory) {
  try {
    await mkdir(directory);
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
  }
}

async function ensurePath(filepath) {
  const directories = path.dirname(filepath).split(path.sep);

  let directory = directories[0];

  for (let i = 1; i < directories.length; ++i) {
    directory += path.sep + directories[i];
    await mkdirMaybe(directory);
  }
}

async function compressFiles(inputFolder, outputFolder, fileList, options) {
  const cwd = path.resolve();

  inputFolder = path.resolve(cwd, inputFolder);
  outputFolder = path.resolve(cwd, outputFolder);

  return pmap(Object.keys(fileList), async (file) => {
    const compressor = zlib.createGzip();
    const assumedInFile = path.resolve(inputFolder, file);
    const outFile = path.resolve(outputFolder, file + '.gz');

    await ensurePath(outFile);

    const inStream = fs.createReadStream(assumedInFile);
    const outStream = fs.createWriteStream(outFile);

    return new Promise((resolve, reject) => {
      pump([ inStream, compressor, outStream ], (error) => {
        if (error) reject(error);

        resolve();
      });
    });
  });
}

module.exports = compressFiles;
