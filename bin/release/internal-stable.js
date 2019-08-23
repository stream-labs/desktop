const releaseScript = require('./mini-release');

releaseScript({
  internalRelease: true,
  githubApiServer: process.env.INTERNAL_GITHUB_API_SERVER,
  organization: process.env.INTERNAL_GITHUB_ORGANIZATION,
  repository: process.env.INTERNAL_GITHUB_REPOSITORY,
  remote: process.env.INTERNAL_GITHUB_REMOTE_NAME,
  targetBranch: process.env.INTERNAL_GITHUB_TARGET_BRANCH,
  sentryOrganization: process.env.INTERNAL_SENTRY_ORGANIZATION,
  sentryProject: process.env.INTERNAL_SENTRY_PROJECT,
  githubTokenForReadPullRequest: process.env.NAIR_GITHUB_TOKEN,
  githubTokenForUploadArtifacts: process.env.NAIR_GITHUB_TOKEN_INTERNAL,
  s3BucketNameForUploadArtifacts: process.env.RELEASE_DWANGO_S3_BUCKET_NAME,
});
