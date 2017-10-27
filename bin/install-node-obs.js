/**
 * This script downloads and exctracts the specified release of node-obs
 */

const NODE_OBS_VERSION = '0.1.23';

const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const childProcess = require('child_process');
const rimraf = require('rimraf');

const archivePath = path.join(os.tmpdir(), `node-obs-${NODE_OBS_VERSION}.zip`);
const archive = fs.createWriteStream(archivePath);

const zipExe = path.resolve(__dirname, '..', 'node_modules', '7zip-bin-win', 'x64', '7za.exe');
const slobsDir = path.resolve(__dirname, '..');

const continuePromise = new Promise(resolve => {
  const nodeObsPath = path.join(slobsDir, 'node-obs');

  if (fs.existsSync(nodeObsPath)) {
    rimraf(nodeObsPath, resolve);
  } else {
    resolve();
  }
});

continuePromise.then(() => {
  const releaseUrl = `https://github.com/stream-labs/node-obs/releases/download/v${NODE_OBS_VERSION}/node-obs.zip`;

  archive.on('finish', () => {
    childProcess.exec(`${zipExe} x "${archivePath}" -o"${slobsDir}"`, (error, stdout, stderr) => {
        if (error) {
          console.error(`Extraction error: ${error}`);
          return;
        }

        console.log(stdout);
        console.log(stderr);
    });
  });

  https.get(releaseUrl, response => {
    // Follow redirect
    https.get(response.headers.location, response => response.pipe(archive));
  });
});
