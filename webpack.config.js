const { VueLoaderPlugin } = require('vue-loader');
const ESLintPlugin = require('eslint-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const { sentryWebpackPlugin } = require('@sentry/webpack-plugin');

const path = require('node:path');

const package = require('./package.json');

const plugins = [];
plugins.push(
  sentryWebpackPlugin({
    org: 'n-air-app2',
    project: package.name === 'n-air-app' ? 'n-air-app' : 'n-air-app-unstable',
    authToken: process.env.SENTRY_AUTH_TOKEN,
    release: {
      version: JSON.stringify(package.version),
    },
  }),
);
plugins.push(new VueLoaderPlugin());
plugins.push(new ESLintPlugin({ extensions: ['js', 'ts'] }));

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

  cache: {
    type: 'filesystem',
    buildDependencies: {
      config: [__filename],
    },
  }, // if problem, clean node_modules/.cache

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

  devtool: 'source-map',

  target: 'electron-renderer',

  resolve: {
    extensions: ['.js', '.ts', '.tsx'],
    modules: [path.resolve(__dirname, 'app'), 'node_modules'],
  },

  // We want to dynamically require native addons
  externals: {
    'font-manager': 'require("font-manager")',

    // Not actually a native addons, but for one reason or another
    // we don't want them compiled in our webpack bundle.
    'aws-sdk': 'require("aws-sdk")',
    asar: 'require("asar")',
    'node-fontinfo': 'require("node-fontinfo")',
    'socket.io-client': 'require("socket.io-client")',
    rimraf: 'require("rimraf")',

    'utf-8-validate': 'require("utf-8-validate")',
    bufferutil: 'require("bufferutil")',
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
        test: /\.tsx$/,
        exclude: /node_modules|vue\/src/,
        use: ['babel-loader', { loader: 'ts-loader' }],
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: [/node_modules/, path.join(__dirname, 'bin')],
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
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [require('autoprefixer')({ grid: true })],
              },
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
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [require('autoprefixer')({ grid: true })],
              },
            },
          },
          'less-loader',
        ],
      },
      {
        test: /\.(png|jpe?g|gif|mp4|mp3|ico|wav|webm)(\?.*)?$/,
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
