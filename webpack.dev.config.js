const { merge } = require('webpack-merge');
const baseConfig = require('./webpack.base.config.js');
const path = require('path');
const HardSourceWebpackPlugin = require('hard-source-webpack-plugin');
const { CheckerPlugin } = require('awesome-typescript-loader');

const SpeedMeasurePlugin = require('speed-measure-webpack-plugin');

const smp = new SpeedMeasurePlugin();

const plugins = [];

if (process.env.SLOBS_FORKED_TYPECHECKING) plugins.push(new CheckerPlugin());
// if (!process.env.CI) plugins.push(new HardSourceWebpackPlugin());

module.exports = smp.wrap(merge(baseConfig, {
  entry: {
    renderer: './app/app.ts',
    updater: './updater/mac/ui.js',
    'guest-api': './guest-api',
  },

  mode: 'development',
  devtool: 'source-map',
  watchOptions: {
    ignored: [/node_modules/, /\.js$/, /\.d\.ts$/],
  },

  // module: {
  //   rules: [
  //     {
  //       test: /\.ts$/,
  //       loader: 'awesome-typescript-loader',
  //       options: { useCache: true, forceIsolatedModules: true, reportFiles: ['app/**/*.ts'] },
  //       exclude: /node_modules|vue\/src/,
  //     },
  //     {
  //       test: /\.tsx$/,
  //       include: path.resolve(__dirname, 'app/components'),
  //       use: [
  //         'babel-loader',
  //         {
  //           loader: 'awesome-typescript-loader',
  //           options: {
  //             forceIsolatedModules: true,
  //             reportFiles: ['app/components/**/*.tsx'],
  //             configFileName: 'tsxconfig.json',
  //             instance: 'tsx-loader',
  //           },
  //         },
  //       ],
  //       exclude: /node_modules/,
  //     },
  //     {
  //       test: /\.tsx?$/,
  //       enforce: 'pre',
  //       loader: 'eslint-loader',
  //     },
  //   ],
  // },

  plugins,
}));

console.log(JSON.stringify(module.exports, null, 2));
