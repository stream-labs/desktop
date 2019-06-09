const { App } = require("@octokit/app");
const { request } = require("@octokit/request");

/**
 * A wrapper for the Github API
 */
class GithubClient {

  constructor (appId, privateKey, owner, repo) {
    this.appId = appId;
    this.owner = owner;
    this.repo = repo;
    this.privateKey = privateKey;
    this.installationAccessToken = '';
    this.isLoggedIn = false;
  }

  async login() {
    if (this.isLoggedIn) return;

    const app = new App({ id: this.appId, privateKey: this.privateKey });
    const jwt = app.getSignedJsonWebToken();

    // GET an individual installation
    // https://developer.github.com/v3/apps/#find-repository-installation
    const { data } = await request("GET /repos/:owner/:repo/installation", {
      owner: this.owner,
      repo: this.repo,
      headers: {
        authorization: `Bearer ${jwt}`,
        accept: "application/vnd.github.machine-man-preview+json"
      }
    });
    const installationId = data.id;
    this.installationAccessToken = await app.getInstallationAccessToken({ installationId });
    this.isLoggedIn = true;
  }

  /**
   * Create or update a Github Check
   *
   * @example
   * postCheck({
   *   head_sha: 'a9a4333436d7d2f9f82cbf33085d307084a7330f',
   *   status: "in_progress",
   *   name: 'My Name',
   *   output: {
   *     title: 'My Title',
   *   }
   * })
   *
   * @see
   * https://developer.github.com/v3/checks/runs/#create-a-check-run
   */
  async postCheck(params) {
    await this.login();
    return await request("POST /repos/:owner/:repo/check-runs", {
      owner: this.owner,
      repo: this.repo,
      ...params,
      headers: {
        authorization: `token ${this.installationAccessToken}`,
        accept: "application/vnd.github.antiope-preview+json"
      },
    });
  }

  async comment(issueNum, message) {
    await this.login();
    return await request("POST /repos/:owner/:repo/issues/:issue/comments", {
      owner: this.owner,
      repo: this.repo,
      issue: issueNum,
      body: message,
      headers: {
        authorization: `token ${this.installationAccessToken}`,
        accept: "application/vnd.github.antiope-preview+json"
      },
    });
  }
};

/**
 * Use environment variables to instantiate the client
 * @returns {GithubClient}
 */
function initGithubClientViaEnv() {
  require('dotenv').config();
  const {
    STREAMLABS_BOT_ID,
    STREAMLABS_BOT_KEY,
    BUILD_REPOSITORY_NAME
  } = process.env;
  const botKey = STREAMLABS_BOT_KEY.replace(/;/g, '\n');
  const [owner, repo] = BUILD_REPOSITORY_NAME.split('/');
  return new GithubClient(STREAMLABS_BOT_ID, botKey, owner, repo);
}

module.exports.GithubClient = GithubClient;
module.exports.initGithubClientViaEnv = initGithubClientViaEnv;
