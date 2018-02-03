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
const FACE_MASK_VERSION = '0.5.1';

// This is the main function
async function runScript() {
  const zipExe = path.resolve(__dirname, 'node_modules', '7zip-bin-win', 'x64', '7za.exe');
  const slobsDir = path.resolve(__dirname, '..');
  const nodeObsPath = path.join(slobsDir, 'node_modules', 'obs-studio-node', 'libobs');

  /* EXTRACT BROWSER PLUGIN */
  const browserPluginArchivePath = path.join(slobsDir, 'plugins', 'obs-browser-2987-old.7z');

  sh.echo('Extracting obs-browser archive...');
  let result = sh.exec(`"${zipExe}" x "${browserPluginArchivePath}" -o"${nodeObsPath}" -aos`);

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
  result = sh.exec(`"${zipExe}" x "${faceMaskArchivePath}" -o"${nodeObsPath}" -aos`);

  if (result.code !== 0) {
    sh.echo(colors.red('ERROR: Extraction failed!'));
    sh.exit(1);
  }

  sh.echo('Cleaning up archives...');
  sh.rm(faceMaskArchivePath);
}

runScript().then(() => sh.exit(0));
