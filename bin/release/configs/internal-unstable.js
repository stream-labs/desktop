const base = require('./internal-stable');

const config = {
  ...base,
  target: {
    ...base.target,
    branch: `${base.target.branch}-unstable`,
  },
};

module.exports = config;
