const base = {
  appId: 'com.streamlabs.slobs',
  productName: 'Streamlabs OBS',
  icon: 'media/images/icon.ico',
  files: [
    'bundles',
    '!bundles/*.js.map',
    'node_modules',
    'vendor',
    'app/i18n',
    'media/images/game-capture',
    'updater/build/bootstrap.js',
    'index.html',
    'main.js',
    'obs-api'
  ],
  extraFiles: [
    'LICENSE',
    'AGREEMENT',
    'shared-resources/*',
    '!shared-resources/README'
  ],
  nsis: {
    license: 'AGREEMENT',
    oneClick: false,
    perMachine: true,
    allowToChangeInstallationDirectory: true,
    include: 'installer.nsh'
  },
  publish: {
    provider: 'generic',
    url: 'https://slobs-cdn.streamlabs.com'
  },
  win: {
    rfc3161TimeStampServer: 'http://timestamp.digicert.com',
    timeStampServer: 'http://timestamp.digicert.com'
  },
  extraMetadata: {
    env: 'production'
  }
};

if (!process.env.SLOBS_NO_SIGN) base.win.certificateSubjectName = 'Streamlabs (General Workings, Inc.)';

module.exports = base;
