// Packages the electron app for distribution

const builder = require("electron-builder");
const Platform = builder.Platform;

builder.build({
  targets: Platform.WINDOWS.createTarget(),
  config: {
    appId: 'com.streamlabs.slobs',
    productName: 'Streamlabs OBS',
    files: [
      'bundles',
      'node_modules',
      'public',
      'index.html',
      'main.js',
    ],
    extraFiles: ['node-obs', 'config'],
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
