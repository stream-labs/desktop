const request = require('request');

const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4/zones';

function getCloudflareHeaders() {
  return {
    'X-Auth-Email': process.env.CLOUDFLARE_AUTH_EMAIL,
    'X-Auth-Key': process.env.CLOUDFLARE_AUTH_KEY,
    'Content-Type': 'application/json'
  };
}

function getCloudflareZoneId() {
  return new Promise((resolve, reject) => {
    request.get({
      url: `${CLOUDFLARE_API_BASE}?name=streamlabs.com`,
      headers: getCloudflareHeaders()
    }, (err, res, body) => {
      if (err || Math.floor(res.statusCode / 100) !== 2) {
        reject(err || res.statusMessage);
      } else {
        resolve(JSON.parse(body).result[0].id);
      }
    });
  });
}

function purgeUrlsInZone(zone, urls) {
  return new Promise((resolve, reject) => {
    request.post({
      url: `${CLOUDFLARE_API_BASE}/${zone}/purge_cache`,
      headers: getCloudflareHeaders(),
      json: { files: urls }
    }, (err, res) => {
      if (err || Math.floor(res.statusCode / 100) !== 2) {
        reject(err || res.statusMessage);
      } else {
        resolve();
      }
    });
  });
}

async function purgeUrls(urls) {
  const zone = await getCloudflareZoneId();
  await purgeUrlsInZone(zone, urls);
}

module.exports = { purgeUrls };
