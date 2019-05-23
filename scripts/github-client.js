const { App } = require("@octokit/app");
const { request } = require("@octokit/request");

/**
 * Simplifies communication with gihub API
 */
export class GithubClient {

  constructor (appId, owner, repo, privateKey) {
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


(async function main() {



  const APP_ID = 31307;
  const PRIVATE_KEY = "-----BEGIN RSA PRIVATE KEY-----\n" +
                      "MIIEoAIBAAKCAQEA0Xs5CWiAO+ek12ry9TI4CJ6cHI+TG8LkVjFKoObkI7fDTXz+\n" +
                      "ugazJfgQh5XzaALnBFQfO8s9pJyxC/VETx3EERkUXufA/OCHRcl80EgumXFN9b5p\n" +
                      "Hwx+xizRtMU4bAaQhKr/u6fzhnX0clJclpIuWVDCeMpVRPeFxlmRntxmZxjGcL1r\n" +
                      "395qCwu/KhTe/QNKFAY6YRB8pAEn1JeFbIWK82QbMD8M4/srUsqWVgl8W7Od4mXB\n" +
                      "sjBGyFWgfiWeLCw5fAKxdGJZwPV73tTKxQVL/zChAedDx68jRzrnxDeAVu7fjEjb\n" +
                      "s7C7DWMPKV4nInnoE2++nA6UNd90rgyS9VY3KQIDAQABAoIBAHP3zH6Z3IvNVGNx\n" +
                      "MKlvMLgM3o2tKhpvTSsuRItI5zmizLsEHJxtgxXc+4GkEMke+jdaPqRCgpCzsgvV\n" +
                      "rwhBiT6R7MYRdLRJtHl87tz7aNjHcgo+bEGlEDWzsDBsEi0zgSQA6mw/sUBZ4oa7\n" +
                      "c8hjisclP1PRZ10zzlodUdFpYENn4mPv6bQfjtK9BmcGvvvQiTLes3xMxQABtSsB\n" +
                      "nI95K1hDaHKa2UFd7ukB/C1vRRLw4Up74qcLeFQLqw+pOC9THs/asHou8lJGm1r2\n" +
                      "Tlws17pgg0HamnZS+SCn1z9PKCwcDfdpBHw6qdRyefSueF+yX+FP0a3Ot3sBuN8W\n" +
                      "aLMSQoECgYEA6KINawBH6oY8j7PGlHFyiH22iZoM22RSdWggJg3y93VplKIUOyYZ\n" +
                      "2nyRaKitDEOXvs/MzpKWN3Qt8XrfTXLFkaqf5nYunA9sHUrxLKAd+P2mpY3pUT0A\n" +
                      "uD1m4Y+d2BY3JQMWQOlYT53GgcVAJ76jCbSxVOg0YWkrfKCLDvkvkHkCgYEA5oXY\n" +
                      "jpYnZOiMJR/q8TDOm/uQ68tIAf7hwNHtNE5L05mlpo3rD9yNKA92cAd4dfo4Rv+Y\n" +
                      "JPQiwPmR1XkQ7jJsiEGmpDT0NkImicVOEBTkXIQYWO3JhNP0hhDMwAoJDfTkVhx1\n" +
                      "DVRMACmMzOa+F3Msgr4dg6LYMUcINGshZlbUEDECgYBI7IPIRw5ENlBFu9VEM0vz\n" +
                      "/XR7Lg9ZttkidMGfLEA90lCGh0hQQmFYXDQ42qdkcMvgxMMu/kSYnZLJX/sgDBpi\n" +
                      "z1nQpLt3sF3z0MpJcufyZZEX1KSPEtBm8NiPXLXeRxiCQbV4I63LR2oyw+KYkuoI\n" +
                      "4Nu2AhRpdM5tAuaUiwieAQKBgG0SjYnB0Df1tEHonUCr6EZzvHllANg44lZavdKO\n" +
                      "7V/chj2NTth9caiv0Elnr36a+z/UtgdeIIeQTolkNDeQUjwSXCe8CoUVvahYW/xN\n" +
                      "9lM0CVUihcQ8ialZj5eZ5/jbk6KO6m95IFC/WCinUPBFhZ0DGXHsfkCqrF4pBm+m\n" +
                      "y8YxAn9QnxBcnR7p7UeSmw/K47xi6ur9mSUDrhnmqpbpq13nzLT2+DCoa9zp9aDL\n" +
                      "Q1gYtYfgNhVfFEBd4k40yqba4u+4Fsn8ozRqyft6T255ScewIkh45LJg33uV3tG+\n" +
                      "q8uxVB2ruF9V7wR4gD8f493jKumCq4yUxxjLT30+VtsfoRp+\n" +
                      "-----END RSA PRIVATE KEY-----\n";

  const app = new App({ id: APP_ID, privateKey: PRIVATE_KEY });
  const jwt = app.getSignedJsonWebToken();

  // GET an individual installation
  // https://developer.github.com/v3/apps/#find-repository-installation
  const { data } = await request("GET /repos/:owner/:repo/installation", {
    owner: "stream-labs",
    repo: "streamlabs-obs",
    headers: {
      authorization: `Bearer ${jwt}`,
      accept: "application/vnd.github.machine-man-preview+json"
    }
  });
  const installationId = data.id;
  const installationAccessToken = await app.getInstallationAccessToken({ installationId });

  // const resp = await request("GET /repos/:owner/:repo/branches", {
  //   owner: "stream-labs",
  //   repo: "streamlabs-obs",
  //   headers: {
  //     authorization: `token ${installationAccessToken}`,
  //     accept: "application/vnd.github.machine-man-preview+json"
  //   },
  // });

  try {
    const resp = await request("POST /repos/:owner/:repo/check-runs", {
      owner: "stream-labs",
      repo: "streamlabs-obs",
      name: 'Snapshots',
      head_sha: 'a9a4333436d7d2f9f82cbf33085d307084a7330f',
      status: "in_progress",
      output: {
        title: 'This is Snapshots Title',
        summary: 'This is Snapshots Summary',
      },
      headers: {
        authorization: `token ${installationAccessToken}`,
        accept: "application/vnd.github.antiope-preview+json"
      },
    });

    console.log(resp);

  } catch (e) {
    console.log(e);
  }

})();
