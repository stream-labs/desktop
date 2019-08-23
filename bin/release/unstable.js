const releaseScript = require('./mini-release');

releaseScript({
  prerelease: true,
  internalRelease: false,
  githubApiServer: 'https://api.github.com',
  organization: 'n-air-app',
  repository: 'n-air-app',
  remote: 'origin',
  targetBranch: 'unstable',
  sentryOrganization: 'n-air-app',
  sentryProject: 'n-air-app',
  githubTokenForReadPullRequest: process.env.NAIR_GITHUB_TOKEN,
  githubTokenForUploadArtifacts: process.env.NAIR_GITHUB_TOKEN,
  s3BucketNameForUploadArtifacts: process.env.RELEASE_S3_BUCKET_NAME,
});
