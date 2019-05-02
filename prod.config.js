const merge = require('webpack-merge');
const baseConfig = require('./base.config.js');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = merge.smart(baseConfig, {
  entry: {
    renderer: './app/app.ts',
    updater: './updater/ui.js',
    'guest-api': './guest-api'
  },

  mode: 'production',
  devtool: 'source-map',

  optimization: {
    minimizer: [new TerserPlugin({
      parallel: true,
      sourceMap: true,
      terserOptions: { mangle: false }
    })],
    usedExports: true,
  }
});
