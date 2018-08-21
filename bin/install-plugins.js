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
const FACE_MASK_VERSION = '0.7.5';

// This is the main function
async function runScript() {
  const zipExe = path.resolve(__dirname, 'node_modules', '7zip-bin-win', 'x64', '7za.exe');
  const slobsDir = path.resolve(__dirname, '..');
  const nodeObsPath = path.join(slobsDir, 'node_modules', 'obs-studio-node');
  const pluginsPath = path.join(slobsDir, 'plugins');

  /* INSTALL FACEMASK PLUGIN */
  const faceMaskArchivePath = path.join(pluginsPath, `facemask-plugin-${FACE_MASK_VERSION}.zip`);

  if (!fs.existsSync(faceMaskArchivePath)) {
    sh.rm('-rf', pluginsPath);
    sh.mkdir('-p', pluginsPath);

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

    // Attempt to deal with some annoyingness on Appveyor
    await new Promise(r => setTimeout(r, 2000));
  }

  sh.echo('Extracting facemask-plugin archive...');
  result = sh.exec(`"${zipExe}" x "${faceMaskArchivePath}" -o"${nodeObsPath}" -aos`);

  if (result.code !== 0) {
    sh.echo(colors.red('ERROR: Extraction failed!'));
    sh.exit(1);
  }
}

runScript().then(() => sh.exit(0));
