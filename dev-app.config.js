const merge = require('webpack-merge');
const devConfig = require('./dev.config.js');

module.exports = merge.strategy({ entry: 'replace' })(devConfig, {
  entry: { renderer: './app/app.ts' },
});
