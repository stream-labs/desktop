// Packages the electron app for distribution

const builder = require("electron-builder");
const Platform = builder.Platform;

builder.build({
  targets: Platform.WINDOWS.createTarget(),
  config: {
    appId: 'com.streamlabs.slobs',
    files: [
      'bundles',
      'config',
      'node_modules',
      'public',
      'index.html',
      'main.js',
    ],
    extraFiles: ['node-obs'],
    asarUnpack: ['*.node']
  }
}).then(() => {
  console.log('SUCCESS');
}).catch((error) => {
  console.log(error);
});
