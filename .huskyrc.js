const { isOptedIn } = require('./scripts/utils');

const hooks = {};

if (isOptedIn('pre-commit')) {
  hooks['pre-commit'] = 'lint-staged';
}

if (isOptedIn('commit-msg')) {
  hooks['commit-msg'] = 'commitlint -E HUSKY_GIT_PARAMS'
}

module.exports = {
  hooks,
};

