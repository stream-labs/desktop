const config = require('./stable.config.js');

config.appId = 'jp.nicovideo.nair-unstable';
config.productName = 'N Air 実験版';
config.extraMetadata.name = 'n-air-app-unstable';
config.extraMetadata.buildProductName = config.productName;
config.publish.url = 'https://n-air-app.nicovideo.jp/download/windows-unstable';

module.exports = config;
