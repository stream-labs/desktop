const { merge } = require('webpack-merge');
const baseConfig = require('./webpack.base.config.js');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = merge(baseConfig, {
  output: {
    filename: chunkData => {
      return chunkData.chunk.name.match(/renderer/) ? '[name].[contenthash].js' : '[name].js';
    },
    chunkFilename: '[name].[contenthash].js',
  },

  mode: 'production',
  devtool: 'source-map',

  optimization: {
    concatenateModules: false,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          mangle: false,
          keep_classnames: true,
        },
      }),
    ],
    usedExports: true,
  },
});
