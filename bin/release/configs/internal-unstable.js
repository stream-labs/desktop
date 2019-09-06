const base = require('./internal-stable');

const config = {
  ...base,
  target: {
    ...base.target,
    branch: `${base.target.branch}-unstable`,
  },
  upload: {
    ...base.upload,
    s3KeyPrefix: 'download/windows-unstable',
  },
};

module.exports = config;
