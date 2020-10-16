const { merge } = require('webpack-merge');
const baseConfig = require('./webpack.base.config.js');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = merge(baseConfig, {
  entry: {
    renderer: './app/app.ts',
    updater: './updater/mac/ui.js',
    'guest-api': './guest-api',
  },

  output: {
    filename: chunkData => {
      return chunkData.chunk.name === 'renderer' ? '[name].[contenthash].js' : '[name].js';
    },
    chunkFilename: '[name].[contenthash].js',
  },

  mode: 'production',
  devtool: 'source-map',

  optimization: {
    minimizer: [
      new TerserPlugin({
        parallel: true,
        sourceMap: true,
        terserOptions: { mangle: false },
      }),
    ],
    usedExports: true,
  },
});
