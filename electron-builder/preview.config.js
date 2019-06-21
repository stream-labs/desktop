const base = require('./base.config');

base.appId = 'com.streamlabs.slobspreview'
base.productName = 'Streamlabs OBS Preview';
base.extraMetadata.name = 'slobs-client-preview';
base.extraFiles.push({
  from: 'scripts/debug-launcher.bat',
  to: 'Streamlabs OBS Preview Debug Mode.bat'
});

module.exports = base;
