const merge = require('webpack-merge');
const baseConfig = require('./base.config.js');
const path = require('path');
const HardSourceWebpackPlugin = require('hard-source-webpack-plugin');
const { CheckerPlugin } = require('awesome-typescript-loader')

const plugins = [new HardSourceWebpackPlugin(), new CheckerPlugin()];

module.exports = merge.smart(baseConfig, {
  entry: {
    renderer: './app/app.ts',
    updater: './updater/ui.js',
    'guest-api': './guest-api',
  },

  mode: 'development',
  devtool: 'cheap-module-source-map',
  watchOptions: { ignored: /node_modules/ },

  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'awesome-typescript-loader',
        options: { useCache: true, forceIsolatedModules: true, reportedFiles: ['app/**/*.ts'] },
        exclude: /node_modules|vue\/src/
      },
      {
        test: /\.tsx$/,
        include: path.resolve(__dirname, 'app/components'),
        loader: [
          'babel-loader',
          {
            loader: 'awesome-typescript-loader',
            options: { forceIsolatedModules: true, reportedFiles: ['app/components/**/*.tsx'] }
          }
        ],
        exclude: /node_modules/,
      },
    ]
  },

  plugins,
});
