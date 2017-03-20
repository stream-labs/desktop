// Packages the electron app for distribution

const builder = require("electron-builder")
const Platform = builder.Platform

builder.build({
  targets: Platform.WINDOWS.createTarget(),
  config: {
  	appId: 'com.streamlabs.slobs',
  	extraFiles: [
  		'node_modules/node-obs/**/*'
  	]
  }
}).then(() => {
  console.log('SUCCESS');
}).catch((error) => {
  console.log(error);
})
