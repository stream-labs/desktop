const base = require('./public-stable');

const config = {
  ...base,
  target: {
    ...base.target,
    branch: 'n-air_unstable',
  },
  upload: {
    ...base.upload,
    s3KeyPrefix: 'download/windows-unstable',
  },
};

module.exports = config;
