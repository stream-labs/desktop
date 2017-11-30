/**
 * This script downloads and exctracts the specified release of node-obs
 * along with any additional plugins.
 */

// IMPORTS
const sh = require('shelljs');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const colors = require('colors/safe');

// CONFIGURATION
const NODE_OBS_VERSION = '0.1.31';
const FACE_MASK_VERSION = '0.3.3';

// This is the main function
async function runScript() {
  const zipExe = path.resolve(__dirname, 'node_modules', '7zip-bin-win', 'x64', '7za.exe');
  const slobsDir = path.resolve(__dirname, '..');
  const nodeObsPath = path.join(slobsDir, 'node-obs');

  /* INSTALL NODE-OBS */
  const nodeObsnodeObsArchivePath = path.join(os.tmpdir(), `node-obs-${NODE_OBS_VERSION}.zip`);
  const nodeObsArchive = fs.createWriteStream(nodeObsnodeObsArchivePath);
  const nodeObsArchiveFinishPromise = new Promise(resolve => nodeObsArchive.on('finish', resolve));
  const nodeObsReleaseUrl = `https://github.com/stream-labs/node-obs/releases/download/v${NODE_OBS_VERSION}/node-obs.zip`;

  sh.echo('Removing old version of node-obs...');
  if (fs.existsSync(nodeObsPath)) {
    sh.rm('-rf', nodeObsPath);
  }

  sh.echo(`Downloading node-obs version ${NODE_OBS_VERSION}...`);
  https.get(nodeObsReleaseUrl, response => {
    // Follow redirect
    https.get(response.headers.location, response => response.pipe(nodeObsArchive));
  });

  await nodeObsArchiveFinishPromise;

  sh.echo('Extracting node-obs archive...');
  let result = sh.exec(`"${zipExe}" x "${nodeObsnodeObsArchivePath}" -o"${slobsDir}"`);

  if (result.code !== 0) {
    sh.echo(colors.red('ERROR: Extraction failed!'));
    sh.exit(1);
  }

  /* INSTALL FACEMASK PLUGIN */
  const faceMaskArchivePath = path.join(os.tmpdir(), `facemask-plugin-${FACE_MASK_VERSION}.zip`);
  const faceMaskArchive = fs.createWriteStream(faceMaskArchivePath);
  const faceMaskArchiveFinishPromise = new Promise(resolve => faceMaskArchive.on('finish', resolve));
  const faceMaskReleaseUrl = `https://github.com/stream-labs/facemask-plugin/releases/download/${FACE_MASK_VERSION}/` +
    `facemask-plugin-${FACE_MASK_VERSION}.zip`;

  sh.echo(`Downloading facemask-plugin version ${FACE_MASK_VERSION}...`);
  https.get(faceMaskReleaseUrl, response => {
    // Follow redirect
    https.get(response.headers.location, response => response.pipe(faceMaskArchive));
  });

  await faceMaskArchiveFinishPromise;

  sh.echo('Extracting facemask-plugin archive...');
  result = sh.exec(`"${zipExe}" x "${faceMaskArchivePath}" -o"${nodeObsPath}"`);

  if (result.code !== 0) {
    sh.echo(colors.red('ERROR: Extraction failed!'));
    sh.exit(1);
  }

  sh.echo('Cleaning up archives...');
  sh.rm(nodeObsnodeObsArchivePath);
  sh.rm(faceMaskArchivePath);
}

runScript().then(() => sh.exit(0));
