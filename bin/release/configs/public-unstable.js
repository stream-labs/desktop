const base = require('./public-stable');

const config = {
  ...base,
  target: {
    ...base.target,
    branch: 'n-air_unstable',
  },
};

module.exports = config;
