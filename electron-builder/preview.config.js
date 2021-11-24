const base = require('./base.config');

base.appId = 'com.streamlabs.slobspreview';
base.productName = 'Streamlabs Desktop Preview';
base.extraMetadata.name = 'slobs-client-preview';
base.win.extraFiles.push({
  from: 'scripts/debug-launcher.bat',
  to: 'Streamlabs Desktop Preview Debug Mode.bat',
});
base.win.extraFiles.push({
  from: 'node_modules/streamlabs-desktop-launcher/streamlabs-desktop-launcher.exe',
  to: 'Streamlabs OBS Preview.exe',
});
base.win.extraFiles = base.win.extraFiles.filter(f => {
  if (typeof f === 'object') {
    return f.to !== 'Streamlabs OBS.exe';
  } else {
    return true;
  }
});

module.exports = base;
