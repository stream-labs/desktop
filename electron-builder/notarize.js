const { notarize } = require('electron-notarize');
const fs = require('fs');

exports.default = async function notarizing(context) {
  const appName = context.packager.appInfo.productFilename;
  const appPath = `${context.appOutDir}/${appName}.app`;

  if (!fs.existsSync(appPath)) {
    throw new Error(`Cannot find application for notarization at: ${appPath}`);
  }

  console.log(`Notarizing app found at: ${appPath}`);
  console.log('This can take several minutes.');

  // await notarize({
  //   appPath,
  //   appBundleId: 'com.streamlabs.slobs',
  //   appleId: process.env['APPLE_ID'],
  //   appleIdPassword: process.env['APPLE_APP_PASSWORD'],
  //   ascProvider: process.env['APPLE_ASC_PROVIDER']
  // });

  console.log('Notarization finished.');
};
