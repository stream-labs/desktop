const { App } = require("@octokit/app");
const { request } = require("@octokit/request");

/**
 * A wrapper for the Github API
 */
module.exports.GithubClient = class GithubClient {

  constructor (appId, privateKey, owner, repo) {
    this.appId = appId;
    this.owner = owner;
    this.repo = repo;
    this.privateKey = privateKey;
    this.installationAccessToken = '';
  }

  async login() {
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
  }

  /**
   * Create or update a Github Check
   *
   * @example
   * postCheck({
   *   head_sha: 'a9a4333436d7d2f9f82cbf33085d307084a7330f',
   *   status: "in_progress",
   *   output: {
   *     title: 'This is Snapshots Title',
   *   }
   * })
   *
   * @see
   * https://developer.github.com/v3/checks/runs/#create-a-check-run
   */
  async postCheck(params) {
    return await request("POST /repos/:owner/:repo/check-runs", {
      owner: "stream-labs",
      repo: "streamlabs-obs",
      name: 'Snapshots',
      ...params,
      headers: {
        authorization: `token ${this.installationAccessToken}`,
        accept: "application/vnd.github.antiope-preview+json"
      },
    });
  }

}
