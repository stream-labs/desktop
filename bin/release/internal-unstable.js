// @ts-check
const releaseScript = require('./mini-release');

releaseScript({
  releaseChannel: 'stable',
  releaseEnvironment: 'internal',
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
  },
  githubTokenForReadPullRequest: process.env.NAIR_GITHUB_TOKEN,
});
