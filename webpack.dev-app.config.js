const { merge } = require('webpack-merge');
const devConfig = require('./webpack.dev.config.js');

module.exports = merge.strategy({ entry: 'replace' })(devConfig, {
  entry: { renderer: './app/app.ts' },
});
