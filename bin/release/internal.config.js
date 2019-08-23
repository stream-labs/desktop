// @ts-check

const { checkEnv } = require('./scripts/util');

checkEnv('INTERNAL_GITHUB_API_SERVER');
checkEnv('INTERNAL_GITHUB_ORGANIZATION');
checkEnv('INTERNAL_GITHUB_REPOSITORY');
checkEnv('INTERNAL_GITHUB_REMOTE_NAME');
checkEnv('INTERNAL_GITHUB_TARGET_BRANCH');
checkEnv('INTERNAL_SENTRY_ORGANIZATION');
checkEnv('INTERNAL_SENTRY_PROJECT');
checkEnv('INTERNAL_GITHUB_API_SERVER');
checkEnv('NAIR_GITHUB_TOKEN_INTERNAL');
checkEnv('RELEASE_DWANGO_S3_BUCKET_NAME');

module.exports = {
  target: {
    host: process.env.INTERNAL_GITHUB_API_SERVER,
    organization: process.env.INTERNAL_GITHUB_ORGANIZATION,
    repository: process.env.INTERNAL_GITHUB_REPOSITORY,
    remote: process.env.INTERNAL_GITHUB_REMOTE_NAME,
    branch: process.env.INTERNAL_GITHUB_TARGET_BRANCH,
  },
  sentry: {
    organization: process.env.INTERNAL_SENTRY_ORGANIZATION,
    project: process.env.INTERNAL_SENTRY_PROJECT,
  },
  upload: {
    githubToken: process.env.NAIR_GITHUB_TOKEN_INTERNAL,
    s3BucketName: process.env.RELEASE_DWANGO_S3_BUCKET_NAME,
  }
};
