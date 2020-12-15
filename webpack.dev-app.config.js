const { mergeWithCustomize, customizeObject } = require('webpack-merge');
const devConfig = require('./webpack.dev.config.js');

module.exports = mergeWithCustomize({
  customizeObject: customizeObject({
    entry: 'replace',
  }),
})(devConfig, {
  entry: { renderer: './app/app.ts' },
});
