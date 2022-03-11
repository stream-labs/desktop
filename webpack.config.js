/* eslint-disable prettier/prettier */
const { VueLoaderPlugin } = require('vue-loader');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

const plugins = [];

/*
plugins.push(
  new WebpackManifestPlugin({
    basePath: 'bundles/',
    filter: file =>
      ['renderer.js', 'vendors~renderer.js', 'renderer.js.map', 'vendors~renderer.js.map'].includes(
        file.name,
      ),
  }),
);
*/

// plugins.push(new CleanWebpackPlugin());

plugins.push(new VueLoaderPlugin());

module.exports = {
  entry: {
    renderer: './app/app.ts',
    updater: './updater/ui.js',
  },
  output: {
    path: `${__dirname}/bundles`,
    filename: '[name].js',
    publicPath: '/bundles/',
  },

  devServer: {
    static: {
      directory: __dirname,
      publicPath: '/',
    },
    proxy: {
      '/account': {
        target: 'https://account.nicovideo.jp',
        changeOrigin: true,
        pathRewrite: { '^/account': '' },
      },
      '/oauth': {
        target: 'https://oauth.nicovideo.jp',
        changeOrigin: true,
        pathRewrite: { '^/oauth': '' },
      },
      '/blog': {
        target: 'https://blog.nicovideo.jp',
        changeOrigin: true,
        pathRewrite: { '^/blog': '' },
      },
    },
  },

  devtool: 'cheap-module-source-map', // source-map',

  target: 'electron-renderer',

  resolve: {
    extensions: ['.js', '.ts'],
    modules: [path.resolve(__dirname, 'app'), 'node_modules'],
  },

  // We want to dynamically require native addons
  externals: {
    'font-manager': 'require("font-manager")',

    // Not actually a native addons, but for one reason or another
    // we don't want them compiled in our webpack bundle.
    'aws-sdk': 'require("aws-sdk")',
    'asar': 'require("asar")',
    'backtrace-node': 'require("backtrace-node")',
    'node-fontinfo': 'require("node-fontinfo")',
    'socket.io-client': 'require("socket.io-client")',
    'rimraf': 'require("rimraf")',
    'request': 'require("request")',
  },

  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          esModule: true,
          transformToRequire: {
            video: 'src',
            source: 'src',
          },
        },
      },
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        exclude: /node_modules|vue\/src/,
      },
      {
        test: /\.ts$/,
        enforce: 'pre',
        loader: 'eslint-loader',
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
            },
          },
        ],
      },
      {
        test: /\.less$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
            },
          },
          'less-loader',
        ],
      },
      {
        test: /\.(png|jpe?g|gif|mp4|ico|wav|webm)(\?.*)?$/,
        loader: 'file-loader',
        options: {
          name: '[name]-[hash].[ext]',
          outputPath: 'media/',
          publicPath: 'bundles/media/',
        },
      },
      // Handles custom fonts. Currently used for icons.
      {
        test: /\.woff$/,
        loader: 'file-loader',
        options: {
          name: '[name].[ext]',
          outputPath: 'fonts/',
          publicPath: 'bundles/fonts/',
        },
      },
      {
        test: /\.svg$/,
        use: ['vue-svg-loader'],
      },
    ],
  },

  optimization: {
    splitChunks: {
      chunks: chunk => chunk.name === 'renderer',
      name: 'vendors~renderer',
    },
    chunkIds: 'named',
    minimizer: [new TerserPlugin({ sourceMap: true, terserOptions: { mangle: false } })],
  },

  plugins,

  stats: {
    warningsFilter: ["Can't resolve 'osx-temperature-sensor'"],
  },
};
