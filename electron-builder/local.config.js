const config = require('./stable.config.js');

config.productName += '(Local)';
delete config.publish;
delete config.upload;
config.extraMetadata.buildProductName = config.productName;

module.exports = config;
