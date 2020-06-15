const signtool = require('signtool');

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
    'updater/build/bundle-updater.js',
    'updater/index.html',
    'index.html',
    'main.js',
    'obs-api',
  ],
  extraFiles: ['LICENSE', 'AGREEMENT', 'shared-resources/*', '!shared-resources/README'],
  nsis: {
    license: 'AGREEMENT',
    oneClick: false,
    perMachine: true,
    allowToChangeInstallationDirectory: true,
    include: 'installer.nsh',
  },
  publish: {
    provider: 'generic',
    url: 'https://slobs-cdn.streamlabs.com',
  },
  win: {
    rfc3161TimeStampServer: 'http://timestamp.digicert.com',
    timeStampServer: 'http://timestamp.digicert.com',
    async sign(config) {
      if (process.env.SLOBS_NO_SIGN) return;

      if (
        config.path.indexOf('node_modules\\obs-studio-node\\data\\obs-plugins\\win-capture') !== -1
      ) {
        console.log(`Skipping ${config.path}`);
        return;
      }

      console.log(`Signing ${config.path}`);
      await signtool.sign(config.path, {
        subject: 'Streamlabs (General Workings, Inc.)',
        rfcTimestamp: 'http://timestamp.digicert.com',
        algorithm: config.hash,
      });
    },
  },
  extraMetadata: {
    env: 'production',
  },
};

module.exports = base;
