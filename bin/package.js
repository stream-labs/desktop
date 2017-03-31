// Packages the electron app for distribution

const builder = require("electron-builder");
const Platform = builder.Platform;

builder.build({
  targets: Platform.WINDOWS.createTarget('zip'),
  config: {
    appId: 'com.streamlabs.slobs',
    productName: 'Streamlabs OBS',
    files: [
      'bundles',
      'node_modules',
      'vendor',
      'index.html',
      'main.js',
    ],
    extraFiles: ['node-obs', 'node-boost', 'config'],
    asarUnpack: ['**/*.node'],
  },
  extraMetadata: {
    env: 'production'
  }
}).then(() => {
  console.log('SUCCESS');
}).catch((error) => {
  console.log(error);
});
