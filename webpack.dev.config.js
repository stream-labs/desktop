const webpack = require('webpack');
const { merge } = require('webpack-merge');
const baseConfig = require('./webpack.base.config.js');
const path = require('path');

const plugins = [];

// Use the source map plugin so we can override source map location
// The bundle updater serves the maps in development.
plugins.push(
  new webpack.SourceMapDevToolPlugin({
    filename: '[file].map',
    publicPath: 'http://localhost:9000/bundles/',
  }),
);

module.exports = merge(baseConfig, {
  mode: 'development',
  devtool: false,
  watchOptions: {
    ignored: /node_modules/,
  },

  cache: {
    type: 'filesystem',
  },

  plugins,
});
