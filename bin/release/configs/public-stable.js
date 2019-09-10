// @ts-check

const { checkEnv } = require('../scripts/util');

checkEnv('NAIR_GITHUB_TOKEN');
checkEnv('RELEASE_S3_BUCKET_NAME');

module.exports = {
  target: {
    host: 'https://api.github.com',
    organization: 'n-air-app',
    repository: 'n-air-app',
    remote: 'origin',
    branch: 'n-air_stable',
  },
  sentry: {
    organization: 'n-air-app',
    project: 'n-air-app',
  },
  upload: {
    githubToken: process.env.NAIR_GITHUB_TOKEN,
    s3BucketName: process.env.RELEASE_S3_BUCKET_NAME,
    s3KeyPrefix: 'download/windows',
  }
};
