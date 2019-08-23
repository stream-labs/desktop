const config = require('./stable.config.js');

if (!process.env.INTERNAL_PUBLISH_URL) {
  throw new Error('INTERNAL_PUBLISH_URL is not given');
}

config.productName += '(社内版)';
config.publish.url = process.env.INTERNAL_PUBLISH_URL;
config.extraMetadata.buildProductName = config.productName;

module.exports = config;
