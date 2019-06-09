const fs = require('fs');
const uuid = require('uuid');
const initAwsUploaderViaEnv = require( '../../scripts/aws-uploader').initAwsUploaderViaEnv;
const initGithubClientViaEnv = require('../../scripts/github-client').initGithubClientViaEnv;

const FAILED_TESTS_SCREENSHOTS_DIR = 'test-dist/failed-tests';
const {
  SYSTEM_PULLREQUEST_PULLREQUESTNUMBER // this var is provided by Azure Pipelines
} = process.env;

/**
 * upload screenshots of failed tests to the AWS bucket
 */
export async function uploadScreenshotsForFailedTests() {
  if (!SYSTEM_PULLREQUEST_PULLREQUESTNUMBER) return;

  const bucketDir = uuid();
  const uploader = initAwsUploaderViaEnv();
  const uploadState = await uploader.uploadDir(FAILED_TESTS_SCREENSHOTS_DIR, bucketDir);
  if (!uploadState || !uploadState.files.length) return;

  // create an index.html with list links to screenshots
  const indexFilePath = `${FAILED_TESTS_SCREENSHOTS_DIR}/index.html`;
  fs.writeFileSync(indexFilePath,
    `<html><body>` +
    uploadState.files.map(src => `<h5>${src}</h5><img src="${src}"/>`).join() +
    `</body></html>`
  );

  // upload index.html
  const url = await uploader.uploadFile(indexFilePath, `${bucketDir}/index.html`);
  console.info('Preview URL:', url);

  const githubClient = initGithubClientViaEnv();
  await githubClient.comment(SYSTEM_PULLREQUEST_PULLREQUESTNUMBER,
    `Some tests failed on this branch. Screenshot of failed tests have been uploaded to: ${url}`
  );
}
