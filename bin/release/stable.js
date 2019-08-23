// @ts-check
const releaseScript = require('./mini-release');

releaseScript({
  releaseChannel: 'stable',
  releaseEnvironment: 'public',
  target: {
    host: 'https://api.github.com',
    organization: 'n-air-app',
    repository: 'n-air-app',
    remote: 'origin',
    branch: 'n-air_development',
  },
  sentry: {
    organization: 'n-air-app',
    project: 'n-air-app',
  },
  upload: {
    githubToken: process.env.NAIR_GITHUB_TOKEN,
    s3BucketName: process.env.RELEASE_S3_BUCKET_NAME,
  },
  githubTokenForReadPullRequest: process.env.NAIR_GITHUB_TOKEN,
});
