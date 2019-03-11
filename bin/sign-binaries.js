const shell = require('shelljs');
const fs = require('fs');
const path = require('path');
const signtool = require('signtool');

const osn = './node_modules/obs-studio-node/';
const crash_handler = './node_modules/crash-handler/';

async function parseFiles(directory) {
  const files = fs.readdirSync(directory);

  for (const file of files) {
    const fullPath = path.join(directory, file);

    if (fs.statSync(fullPath).isDirectory() && fullPath !== 'node_modules\\obs-studio-node\\data\\obs-plugins\\win-capture') {
      await parseFiles(fullPath);
    } else {
      const absolutePath = path.resolve(fullPath);
      const ext = path.extname(absolutePath)

      if (ext === '.dll' || ext === '.node' || ext === '.exe') {
        console.log('Signing ' + absolutePath);
        await signtool.sign(absolutePath, {
          subject: 'Streamlabs (General Workings, Inc.)',
          rfcTimestamp: 'http://timestamp.digicert.com'
        });
      }
    }
  }
}

(async function() {
  await parseFiles(osn);
  await parseFiles(crash_handler);
})();

