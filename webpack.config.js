const CircularDependencyPlugin = require('circular-dependency-plugin');
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

const plugins = [];


// uncomment to watch circular dependencies

// plugins.push(new CircularDependencyPlugin({
//   // exclude detection of files based on a RegExp
//   exclude: /a\.js|node_modules/,
//   // add errors to webpack instead of warnings
//   //failOnError: true
// }));


module.exports = {
  entry: {
    renderer: './app/app.ts',
    updater: './updater/ui.js',
    'guest-api': './guest-api'
  },
  output: {
    path: __dirname + '/bundles',
    filename: '[name].js'
  },

  devtool: 'source-map',

  target: 'electron-renderer',

  resolve: {
    extensions: ['.js', '.ts', '.json', '.tsx'],
    modules: [path.resolve(__dirname, 'app'), 'node_modules']
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
    'backtrace-js': 'require("backtrace-js")',
    'request': 'require("request")',
    'archiver': 'require("archiver")'
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
            source: 'src'
          },
          loaders: { tsx: ['babel-loader', { loader: 'ts-loader', options: { appendTsxSuffixTo: [/\.vue$/] } }]  }
        }
      },
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        exclude: /node_modules|vue\/src/
      },
      {
        test: /\.tsx$/,
        use: [{ loader: 'babel-loader' }, { loader: 'ts-loader', options: { appendTsxSuffixTo: [/\.vue$/] } }],
        exclude: /node_modules/,
      },
      {
        test: /\.ts$/,
        enforce: 'pre',
        loader: 'tslint-loader'
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.m\.less$/, // Local style modules
        use: [
          { loader: 'style-loader' },
          {
            loader: 'css-loader',
            options: { camelCase: true, localIdentName: '[local]___[hash:base64:5]', modules: true, importLoaders: 1 }
          },
          { loader: 'less-loader' }
        ]
      },
      {
        test: /\.g\.less$/, // Global styles
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1
            }
          },
          'less-loader'
        ]
      },
      {
        test: /\.(png|jpe?g|gif|svg|mp4|ico|wav|webm)(\?.*)?$/,
        loader: 'file-loader',
        options: {
          name: '[name]-[hash].[ext]',
          outputPath: 'media/',
          publicPath: 'bundles/media/'
        }
      },
      // Handles custom fonts. Currently used for icons.
      {
        test: /\.woff$/,
        loader: 'file-loader',
        options: {
          name: '[name].[ext]',
          outputPath: 'fonts/',
          publicPath: 'bundles/fonts/'
        }
      }
    ]
  },

  optimization: {
    minimizer: [new TerserPlugin({
      sourceMap: true,
      terserOptions: { mangle: false }
    })]
  },

  plugins
};
