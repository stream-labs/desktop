const cp = require('child_process');
const fs = require('fs');
const path = require('path');

function signBinaries(directory) {
  const files = fs.readdirSync(directory);

  for (const file of files) {
    const fullPath = path.join(directory, file);

    if (fs.statSync(fullPath).isDirectory()) {
      signBinaries(fullPath);
    } else {
      const absolutePath = path.resolve(fullPath);
      const ext = path.extname(absolutePath);

      if (ext === '.so') {
        console.log('Signing ' + absolutePath);
        cp.execSync(
          `codesign -s "Developer ID Application: Streamlabs LLC (UT675MBB9Q)" "${absolutePath}"`,
        );
      }
    }
  }
}

exports.default = async function(context) {
  if (process.platform !== 'darwin') return;

  console.log('Updating dependency paths');
  cp.execSync(
    `install_name_tool -change ./node_modules/node-libuiohook/libuiohook.0.dylib @executable_path/../Resources/app.asar.unpacked/node_modules/node-libuiohook/libuiohook.0.dylib ${context.appOutDir}/Streamlabs\\ OBS.app/Contents/Resources/app.asar.unpacked/node_modules/node-libuiohook/node_libuiohook.node`,
  );

  signBinaries(context.appOutDir);
};
