export type ReleaseConfig = {
  target: {
    host: string;
    organization: string;
    repository: string;
    remote: string;
    branch: string;
  };
  sentry: {
    organization: string;
    project: string;
  };
  upload: {
    githubToken: string;
    s3BucketName: string;
  };
};
