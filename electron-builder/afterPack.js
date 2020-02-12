const cp = require('child_process');
const fs = require('fs');
const path = require('path');

function sign(filePath) {
  console.log(`Signing: ${filePath}`);
  cp.execSync(`codesign -fs "Developer ID Application: Streamlabs LLC (UT675MBB9Q)" "${filePath}"`);
}

function signBinaries(directory) {
  const files = fs.readdirSync(directory);

  for (const file of files) {
    const fullPath = path.join(directory, file);

    if (fs.statSync(fullPath).isDirectory()) {
      signBinaries(fullPath);
    } else {
      const absolutePath = path.resolve(fullPath);
      const ext = path.extname(absolutePath);

      // Don't follow symbolic links
      if (fs.lstatSync(absolutePath).isSymbolicLink()) continue;

      // Sign dynamic libraries
      if (ext === '.so' || ext === '.dylib') {
        sign(absolutePath);
        continue;
      }

      // This will allow us to detect and sign executable files that
      // aren't marked by a specific extension.
      try {
        fs.accessSync(absolutePath, fs.constants.X_OK);
        sign(absolutePath);
      } catch {}
    }
  }
}

exports.default = async function(context) {
  if (process.platform !== 'darwin') return;

  console.log('Updating dependency paths');
  cp.execSync(
    `install_name_tool -change ./node_modules/node-libuiohook/libuiohook.0.dylib @executable_path/../Resources/app.asar.unpacked/node_modules/node-libuiohook/libuiohook.0.dylib ${context.appOutDir}/Streamlabs\\ OBS.app/Contents/Resources/app.asar.unpacked/node_modules/node-libuiohook/node_libuiohook.node`,
  );

  signBinaries(
    `${context.appOutDir}/${context.packager.appInfo.productName}.app/Contents/Resources/app.asar.unpacked`,
  );
};
